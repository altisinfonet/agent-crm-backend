import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import Razorpay = require("razorpay");
import { SettingsService } from 'src/settings/settings.service';
import { NotificationService } from '@/notification/notification.service';
import { MailService } from '@/mail/mail.service';
import { addWeeks, addMonths, addYears, differenceInCalendarDays } from 'date-fns';
import { SubscriptionCycle } from '@generated/prisma';


@Injectable()
export class TaskService {
    private razorpay: Razorpay;
    private readonly logger = new Logger(TaskService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly settingsService: SettingsService,
        private readonly notificationService: NotificationService,
        private readonly mailService: MailService,
    ) { }
    async onModuleInit() {
        await this.initRazorpay();
    }
    private async initRazorpay() {
        const RazorpaySetting = await this.settingsService.paymentSettings();

        this.razorpay = new Razorpay({
            key_id: RazorpaySetting.RAZORPAY_KEY_ID,
            key_secret: RazorpaySetting.RAZORPAY_KEY_SECRET
        });
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    async reconcileSubscriptions() {
        this.logger.log("Starting subscription reconciliation");
        const MAX_ATTEMPTS = 3;
        const pendingSubs =
            await this.prisma.organizationSubscription.findMany({
                where: {
                    status: "PENDING",
                    reconciliation_attempts: {
                        lt: MAX_ATTEMPTS
                    },
                    rzp_subscription_id: {
                        not: null
                    }
                }
            });

        for (const sub of pendingSubs) {
            try {
                if (!sub || !sub.rzp_subscription_id) {
                    throw new BadRequestException("Subscription not found.");
                }

                const rzpSub =
                    await this.razorpay.subscriptions.fetch(
                        sub.rzp_subscription_id
                    );
                if (
                    rzpSub.status === "authenticated" ||
                    rzpSub.status === "active"
                ) {
                    await this.prisma.organizationSubscription.update({
                        where: { id: sub.id },
                        data: {
                            status: "ACTIVE",
                            start_at: new Date(rzpSub.start_at * 1000),
                            last_reconciled_at: new Date()
                        }
                    });

                    await this.prisma.razorpaySubscription.update({
                        where: { rzp_subscription_id: sub.rzp_subscription_id },
                        data: {
                            status: rzpSub.status,
                            current_cycle: rzpSub.paid_count ?? 0
                        }
                    });

                    continue;
                }

                await this.prisma.organizationSubscription.update({
                    where: { id: sub.id },
                    data: {
                        reconciliation_attempts: { increment: 1 },
                        last_reconciled_at: new Date()
                    }
                });

            } catch (error) {
                await this.prisma.organizationSubscription.update({
                    where: { id: sub.id },
                    data: {
                        reconciliation_attempts: { increment: 1 },
                        last_reconciled_at: new Date()
                    }
                });
            }
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async sendSubscriptionExpiryReminders() {
        try {
            const REMINDER_DAYS = [3, 0];
            const today = new Date();

            const subscriptions =
                await this.prisma.organizationSubscription.findMany({
                    where: {
                        status: 'ACTIVE',
                        auto_renew: true,
                        end_at: {
                            gte: today,
                        },
                    },
                    include: {
                        organization: {
                            include: {
                                createdByUser: {
                                    select: {
                                        email: true,
                                        first_name: true,
                                        last_name: true,
                                    },
                                },
                            },
                        },
                        plan: {
                            select: {
                                name: true,
                                billing_cycle: true,
                            },
                        },
                    },
                });

            for (const sub of subscriptions) {
                if (!sub.start_at || !sub.end_at) continue;

                const cycleEndDate = this.getCurrentCycleEndDate(
                    sub.start_at,
                    sub.plan.billing_cycle,
                    today
                );
                const daysLeft = differenceInCalendarDays(cycleEndDate, today);

                if (!REMINDER_DAYS.includes(daysLeft)) continue;

                const sentDays = sub.expiry_reminder_days_sent ?? [];
                if (sentDays.includes(daysLeft)) continue;

                const user = sub.organization.createdByUser;
                if (!user?.email) continue;

                const userName = `${user.first_name} ${user.last_name}`.trim();
                const renewalLink = `${process.env.WEB_BASE_PATH}`;

                await this.mailService.sendSubscriptionExpiryReminder({
                    to: user.email,
                    name: userName,
                    planName: sub.plan.name,
                    expiryDate: cycleEndDate,
                    daysLeft,
                    renewalLink,
                });

                await this.prisma.organizationSubscription.update({
                    where: { id: sub.id },
                    data: {
                        expiry_reminder_days_sent: {
                            push: daysLeft,
                        },
                    },
                });
            }
        } catch (error) {
            console.error('Subscription cycle reminder error:', error);
        }
    }

    private getCurrentCycleEndDate(
        startAt: Date,
        billingCycle: SubscriptionCycle,
        today: Date
    ): Date {
        let cycleEnd = new Date(startAt);

        while (cycleEnd <= today) {
            switch (billingCycle) {
                case SubscriptionCycle.WEEKLY:
                    cycleEnd = addWeeks(cycleEnd, 1);
                    break;

                case SubscriptionCycle.MONTHLY:
                    cycleEnd = addMonths(cycleEnd, 1);
                    break;

                case SubscriptionCycle.QUARTERLY:
                    cycleEnd = addMonths(cycleEnd, 3);
                    break;

                case SubscriptionCycle.YEARLY:
                    cycleEnd = addYears(cycleEnd, 1);
                    break;

                default:
                    throw new Error(`Unsupported billing cycle: ${billingCycle}`);
            }
        }
        return cycleEnd;
    }



    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async sendBirthdayNotifications() {
        this.logger.log('Running birthday notification job');
        await this.notificationService.sendHBDNotifications();
    }
}
