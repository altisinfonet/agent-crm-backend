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
      console.log("payload", payload);
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
      console.log("event++++++++", event);

      const eventType = event.event;
      const subscription = event.payload.subscription?.entity;
      if (!subscription) return;
      const subId = subscription.id;
      console.log("subscription++++++++", subscription);

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

    } catch (error) {
      throw error;
    }
  }


  findOne(id: number) {
    return `This action returns a #${id} subscription`;
  }

  update(id: number, updateSubscriptionDto: CommonDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
