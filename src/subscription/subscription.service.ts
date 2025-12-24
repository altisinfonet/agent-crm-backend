import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { addDays, addYearsFrom, decryptData } from 'src/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { SettingsService } from 'src/settings/settings.service';
import Razorpay = require("razorpay");
import * as crypto from "crypto";

@Injectable()
export class SubscriptionService {
  private razorpay: Razorpay;
  constructor(
    private prisma: PrismaService,
    private readonly settingsService: SettingsService
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


  async allPlans() {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: {
          is_active: true
        },
        select: {
          code: true,
          name: true,
          description: true,
          price: true,
          currency: {
            select: {
              id: true,
              name: true,
              code: true,
              symbol: true
            }
          },
          billing_cycle: true,
          rzp_plan_id: true,
          created_at: true,
          subscriptionPlanFeatures: {
            select: {
              feature: {
                select: {
                  id: true,
                  key: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      });

      // 🔥 FORMAT RESPONSE
      const formattedPlans = plans.map(plan => ({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billing_cycle: plan.billing_cycle,
        rzp_plan_id: plan.rzp_plan_id,
        created_at: plan.created_at,
        features: plan.subscriptionPlanFeatures.map(spf => spf.feature)
      }));

      return formattedPlans;

    } catch (error) {
      throw error;
    }
  }

  async subscribe(user_id: bigint, dto: CommonDto) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: {
          created_by: user_id,
        }
      })
      if (!org) {
        throw new BadRequestException("User do not have any organization")
      }
      const payload = decryptData(dto.data);

      const { plan_id } = payload;
      const plan = await this.prisma.subscriptionPlan.findFirst({
        where: {
          id: plan_id,
          is_active: true
        }
      });
      if (!plan || !plan?.rzp_plan_id) {
        throw new BadRequestException("Invalid or inactive plan");
      }
      const existing = await this.prisma.organizationSubscription.findFirst({
        where: {
          org_id: org?.id,
          status: "ACTIVE"
        }
      });
      if (existing) {
        throw new BadRequestException("Organization already has an active subscription");
      }
      console.log("existing", existing);

      const TRIAL_DAYS = 0;
      const TEN_YEARS = 10;

      const startAt = addDays(TRIAL_DAYS);
      const endAt = addYearsFrom(startAt, TEN_YEARS);

      const rzpPayload: any = {
        plan_id: plan.rzp_plan_id,
        start_at: startAt,
        end_at: endAt,
        customer_notify: 1,
        notes: {
          org_id: org.id.toString(),
          plan_code: plan.code,
          trial_days: TRIAL_DAYS.toString()
        }
      };
      console.log("rzpPayload", rzpPayload);

      try {
        const rzpSub = await this.razorpay.subscriptions.create(rzpPayload);
        console.log("rzpSub", rzpSub);
        const orgSubscription =
          await this.prisma.organizationSubscription.create({
            data: {
              org_id: org?.id,
              plan_id: plan.id,
              status: "PAUSED",
              start_at: new Date(),
              auto_renew: true,
              rzp_subscription_id: rzpSub?.id
            }
          });

        await this.prisma.razorpaySubscription.create({
          data: {
            org_subscription_id: orgSubscription.id,
            rzp_subscription_id: rzpSub.id,
            rzp_plan_id: rzpSub.plan_id,
            status: rzpSub.status,
            total_count: rzpSub.total_count ?? null,
            current_cycle: rzpSub.paid_count ?? 0,
            start_at: rzpSub.start_at
              ? new Date(rzpSub.start_at * 1000)
              : null,
            end_at: rzpSub.end_at
              ? new Date(rzpSub.end_at * 1000)
              : null
          }
        });
        return {
          subscription_id: rzpSub.id
        };
      } catch (error: any) {
        console.error("Razorpay error:", error?.error || error);
        throw error;
      }

    } catch (error) {
      throw error
    }
  }


  async upgradeSubscription(user_id: bigint, dto: CommonDto) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: {
          created_by: user_id,
        }
      })
      if (!org) {
        throw new BadRequestException("User do not have any organization")
      }
      const payload = decryptData(dto.data);
      const { new_plan_id } = payload;

      if (!new_plan_id) {
        throw new BadRequestException("New plan Id required")
      }
      const currentSub =
        await this.prisma.organizationSubscription.findFirst({
          where: {
            org_id: org?.id,
            status: "ACTIVE"
          },
          include: { plan: true }
        });

      if (!currentSub || !currentSub?.rzp_subscription_id) {
        throw new BadRequestException("No active subscription found");
      }

      const newPlan =
        await this.prisma.subscriptionPlan.findFirst({
          where: {
            id: new_plan_id,
            is_active: true
          }
        });


      if (!newPlan || !newPlan?.rzp_plan_id) {
        throw new BadRequestException("Invalid plan");
      }
      try {
        const fetchrzpSub = await this.razorpay.subscriptions.fetch(currentSub.rzp_subscription_id);
        console.log("fetchrzpSub++++", fetchrzpSub);

        const cancel = await this.razorpay.subscriptions.cancel(
          currentSub.rzp_subscription_id,
          false
          // { cancel_at_cycle_end: 1 }
        );
        console.log("cancel++++", cancel);

        const startAt = addDays(0);
        const endAt = addYearsFrom(startAt, 10);

        const rzpPayload: any = {
          plan_id: newPlan.rzp_plan_id,
          start_at: startAt,
          end_at: endAt,
          customer_notify: 1,
          notes: {
            org_id: org.id.toString(),
            upgraded_from: currentSub.plan.code,
            upgraded_to: newPlan.code
          }
        };


        const rzpSub = await this.razorpay.subscriptions.create(rzpPayload);

        const newOrgSub =
          await this.prisma.organizationSubscription.create({
            data: {
              org_id: org?.id,
              plan_id: newPlan.id,
              status: "PENDING",
              start_at: new Date(),
              rzp_subscription_id: rzpSub.id
            }
          });

        await this.prisma.organizationSubscription.update({
          where: { id: currentSub.id },
          data: {
            status: "UPGRADED"
          }
        });
        return {
          subscription_id: rzpSub.id
        };
      } catch (error: any) {
        console.error("Razorpay error:", error?.error || error);
        throw error;
      }
    } catch (error) {
      throw error
    }
  }

  async razorpayWebhook(body: Buffer, signature: string) {
    try {
      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest("hex");

      if (expected !== signature) {
        throw new Error("Invalid Razorpay webhook signature");
      }

      const event = JSON.parse(body.toString());

      const eventType = event.event;
      const subscription = event.payload.subscription?.entity;
      if (!subscription) return;
      const subId = subscription.id;

      await this.prisma.razorpayEvent.create({
        data: {
          razorpay_entity_id: subId,
          entity_type: "SUBSCRIPTION",
          event_type: eventType,
          payload: event
        }
      });

      switch (eventType) {
        case "subscription.authenticated":
        case "subscription.activated":
          await this.prisma.organizationSubscription.update({
            where: { rzp_subscription_id: subId },
            data: {
              status: "ACTIVE",
              start_at: new Date()
            }
          });
          break;

        case "subscription.charged":
          await this.prisma.razorpaySubscription.update({
            where: { rzp_subscription_id: subId },
            data: {
              current_cycle: { increment: 1 }
            }
          });
          break;

        case "subscription.completed":
          await this.prisma.organizationSubscription.update({
            where: { rzp_subscription_id: subId },
            data: {
              status: "EXPIRED",
              end_at: new Date()
            }
          });
          break;

        case "subscription.cancelled":
        case "subscription.halted":
          {
            const orgSub =
              await this.prisma.organizationSubscription.findUnique({
                where: { rzp_subscription_id: subId }
              });
            if (!orgSub || orgSub.status === "UPGRADED") {
              return;
            }
            await this.prisma.organizationSubscription.update({
              where: { rzp_subscription_id: subId },
              data: {
                status: "CANCELLED",
                cancelled_at: new Date(),
                auto_renew: false
              }
            });
            break;
          }
      }

    } catch (error) {
      throw error;
    }
  }

  update(id: number, updateSubscriptionDto: CommonDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
