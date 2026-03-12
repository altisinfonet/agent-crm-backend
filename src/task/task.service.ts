import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import Razorpay = require("razorpay");
import { SettingsService } from 'src/settings/settings.service';
import { NotificationService } from '@/notification/notification.service';
import { MailService } from '@/mail/mail.service';
import { addWeeks, addMonths, addYears, differenceInCalendarDays } from 'date-fns';
import { SubscriptionCycle, SubscriptionStatus } from '@generated/prisma';
import { MeetingService } from '@/meeting/meeting.service';


@Injectable()
export class TaskService {
    // private razorpay: Razorpay;
    private readonly logger = new Logger(TaskService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly settingsService: SettingsService,
        private readonly notificationService: NotificationService,
        private readonly meetingService: MeetingService,
        private readonly mailService: MailService,
    ) { }
    // async onModuleInit() {
    //     await this.initRazorpay();
    // }
    // private async initRazorpay() {
    //     const RazorpaySetting = await this.settingsService.paymentSettings("payment-settings");

    //     this.razorpay = new Razorpay({
    //         key_id: RazorpaySetting.RAZORPAY_KEY_ID,
    //         key_secret: RazorpaySetting.RAZORPAY_KEY_SECRET
    //     });
    // }

    private async getRazorpayInstance(): Promise<Razorpay> {
        const settings =
            await this.settingsService.paymentSettings("payment-settings");

        return new Razorpay({
            key_id: settings.RAZORPAY_KEY_ID,
            key_secret: settings.RAZORPAY_KEY_SECRET,
        });
    }

    // @Cron(CronExpression.EVERY_10_MINUTES)
    // async reconcileSubscriptions() {
    //     this.logger.log("Starting subscription reconciliation");
    //     const MAX_ATTEMPTS = 3;
    //     const pendingSubs =
    //         await this.prisma.organizationSubscription.findMany({
    //             where: {
    //                 status: "PENDING",
    //                 reconciliation_attempts: {
    //                     lt: MAX_ATTEMPTS
    //                 },
    //                 rzp_subscription_id: {
    //                     not: null
    //                 }
    //             }
    //         });

    //     for (const sub of pendingSubs) {
    //         try {
    //             if (!sub || !sub.rzp_subscription_id) {
    //                 throw new BadRequestException("Subscription not found.");
    //             }

    //             const rzpSub =
    //                 await this.razorpay.subscriptions.fetch(
    //                     sub.rzp_subscription_id
    //                 );
    //             if (
    //                 rzpSub.status === "authenticated" ||
    //                 rzpSub.status === "active"
    //             ) {

    //                 const orgSub =
    //                     await this.prisma.organizationSubscription.findUnique({
    //                         where: { rzp_subscription_id: sub.rzp_subscription_id },
    //                         include: { upgraded_from: true },
    //                     });

    //                 if (!orgSub) return;

    //                 const startAt = rzpSub.start_at
    //                     ? new Date(rzpSub.start_at * 1000)
    //                     : new Date();

    //                 const endAt = rzpSub.end_at
    //                     ? new Date(rzpSub.end_at * 1000)
    //                     : null;


    //                 await this.prisma.organizationSubscription.update({
    //                     where: { id: sub.id },
    //                     data: {
    //                         status: "ACTIVE",
    //                         start_at: startAt,
    //                         end_at: endAt,
    //                         last_reconciled_at: new Date()
    //                     }
    //                 });

    //                 await this.prisma.razorpaySubscription.update({
    //                     where: { rzp_subscription_id: sub.rzp_subscription_id },
    //                     data: {
    //                         status: rzpSub.status,
    //                         current_cycle: rzpSub.paid_count ?? 0
    //                     }
    //                 });
    //                 console.log("orgSub++++++++", orgSub);

    //                 if (orgSub.upgraded_from?.rzp_subscription_id) {
    //                     await this.razorpay.subscriptions.cancel(
    //                         orgSub.upgraded_from.rzp_subscription_id,
    //                         false
    //                     );
    //                     await this.prisma.organizationSubscription.update({
    //                         where: { id: orgSub.upgraded_from.id },
    //                         data: {
    //                             status: "UPGRADED",
    //                             auto_renew: false,
    //                         },
    //                     });
    //                 }

    //                 continue;
    //             }

    //             await this.prisma.organizationSubscription.update({
    //                 where: { id: sub.id },
    //                 data: {
    //                     reconciliation_attempts: { increment: 1 },
    //                     last_reconciled_at: new Date()
    //                 }
    //             });

    //         } catch (error) {
    //             await this.prisma.organizationSubscription.update({
    //                 where: { id: sub.id },
    //                 data: {
    //                     reconciliation_attempts: { increment: 1 },
    //                     last_reconciled_at: new Date()
    //                 }
    //             });
    //         }
    //     }
    // }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async reconcileSubscriptions() {
        this.logger.log("Starting subscription reconciliation");

        const MAX_ATTEMPTS = 3;
        const now = new Date();

        const subs =
            await this.prisma.organizationSubscription.findMany({
                where: {
                    status: { in: ["PENDING", "ACTIVE", "INCOMPLETE"] },
                    reconciliation_attempts: { lt: MAX_ATTEMPTS },
                    rzp_subscription_id: { not: null },
                },
            });
        const razorpay = await this.getRazorpayInstance();

        for (const sub of subs) {
            try {
                if (!sub.rzp_subscription_id) continue;

                const rzpSub =
                    await razorpay.subscriptions.fetch(
                        sub.rzp_subscription_id
                    );

                const startAt = rzpSub.start_at
                    ? new Date(rzpSub.start_at * 1000)
                    : sub.start_at;

                const endAt = rzpSub.end_at
                    ? new Date(rzpSub.end_at * 1000)
                    : sub.end_at;

                let nextStatus: SubscriptionStatus | null = null;

                switch (rzpSub.status) {
                    case "authenticated":
                    case "active":
                        nextStatus = "ACTIVE";
                        break;

                    case "completed":
                        nextStatus = "EXPIRED";
                        break;

                    case "cancelled": {
                        if (endAt && endAt <= now) {
                            nextStatus = "CANCELLED";
                        } else {
                            nextStatus = "ACTIVE";
                        }
                        break;
                    }

                    case "halted":
                        nextStatus = "PAUSED";
                        break;
                }
                const updateData: any = {
                    start_at: startAt,
                    end_at: endAt,
                    auto_renew:
                        rzpSub.status === "cancelled" ? false : sub.auto_renew,
                    last_reconciled_at: new Date(),
                };

                if (nextStatus) {
                    updateData.status = nextStatus;
                }
                await this.prisma.organizationSubscription.update({
                    where: { id: sub.id },
                    data: updateData,
                });
                await this.prisma.razorpaySubscription.updateMany({
                    where: { rzp_subscription_id: sub.rzp_subscription_id },
                    data: {
                        status: rzpSub.status,
                        current_cycle: rzpSub.paid_count ?? 0,
                    },
                });
                if (nextStatus === "ACTIVE") {
                    const orgSub =
                        await this.prisma.organizationSubscription.findUnique({
                            where: { rzp_subscription_id: sub.rzp_subscription_id },
                            include: { upgraded_from: true },
                        });

                    if (!orgSub) return;

                    if (orgSub.upgraded_from?.rzp_subscription_id) {
                        await razorpay.subscriptions.cancel(
                            orgSub.upgraded_from.rzp_subscription_id,
                            false
                        );
                        await this.prisma.organizationSubscription.update({
                            where: { id: orgSub.upgraded_from.id },
                            data: {
                                status: "UPGRADED",
                                auto_renew: false,
                                upgraded_at: new Date(),
                            },
                        });
                    }
                }

                const currentSub = await this.prisma.organizationSubscription.findFirst({
                    where: {
                        rzp_subscription_id: sub.rzp_subscription_id,
                    },
                });

                // if (sub?.status === "INCOMPLETE") {
                if (currentSub && currentSub?.status === "INCOMPLETE") {
                    await this.prisma.razorpaySubscription.delete({
                        where: {
                            rzp_subscription_id: sub.rzp_subscription_id
                        },
                    })
                    await this.prisma.organizationSubscription.delete({
                        where: {
                            rzp_subscription_id: sub.rzp_subscription_id
                        },
                    })
                    const payload = {
                        subscription_id: sub.rzp_subscription_id,
                        payment_id: null,
                        payment_signature: null
                    }
                    await this.prisma.razorpayEvent.create({
                        data: {
                            razorpay_entity_id: sub.rzp_subscription_id,
                            entity_type: "SUBSCRIPTION",
                            event_type: "incomplete.subscription_request.deleted",
                            payload,
                        }
                    })
                }
            } catch (error) {
                await this.prisma.organizationSubscription.update({
                    where: { id: sub.id },
                    data: {
                        reconciliation_attempts: { increment: 1 },
                        last_reconciled_at: new Date(),
                    },
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

    @Cron(CronExpression.EVERY_HOUR)
    async finalizeExpiredSubscriptions() {
        const now = new Date();
        const subscriptions =
            await this.prisma.organizationSubscription.findMany({
                where: {
                    status: {
                        in: ['ACTIVE', 'TRIAL'],
                    },
                    auto_renew: false,
                    end_at: {
                        lte: now,
                    },
                },
            });

        for (const sub of subscriptions) {
            await this.prisma.organizationSubscription.update({
                where: { id: sub.id },
                data: {
                    status: "EXPIRED",
                    cancelled_at: now,
                },
            });
        }

        this.logger.log(`[CRON] Finalized ${subscriptions.length} expired subscriptions`,);
    }


    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async sendBirthdayNotifications() {
        this.logger.log('Running birthday notification job');
        await this.notificationService.sendHBDNotifications();
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async sendMeetingReminderNotifications() {
        this.logger.log('Running Meeting Reminder notification job');
        await this.meetingService.sendMeetingReminderNotifications();
    }
}

