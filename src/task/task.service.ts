import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import Razorpay = require("razorpay");
import { SettingsService } from 'src/settings/settings.service';


@Injectable()
export class TaskService {
    private razorpay: Razorpay;
    private readonly logger = new Logger(TaskService.name);
    constructor(
        private readonly prisma: PrismaService,
        private settingsService: SettingsService
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
}
