import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { addDays, addYearsFrom, decryptData } from '@/common/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { SettingsService } from 'src/settings/settings.service';
import Razorpay = require("razorpay");
import * as crypto from "crypto";

@Injectable()
export class SubscriptionService {
  private razorpay: Razorpay;
  private razorpaySecret: string;
  constructor(
    private prisma: PrismaService,
    private readonly settingsService: SettingsService
  ) { }
  async onModuleInit() {
    await this.initRazorpay();
  }
  private async initRazorpay() {
    const RazorpaySetting = await this.settingsService.paymentSettings("payment-settings");

    this.razorpaySecret = RazorpaySetting.RAZORPAY_KEY_SECRET;
    this.razorpay = new Razorpay({
      key_id: RazorpaySetting.RAZORPAY_KEY_ID,
      key_secret: RazorpaySetting.RAZORPAY_KEY_SECRET,
    });
  }


  async allPlans() {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        orderBy: {
          price: "asc"
        },
        where: {
          is_active: true
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          price: true,
          is_popular: true,
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
          subscriptionFeatures: {
            select: {
              features: true,
              created_at: true
            }
          }
        }
      });

      const formattedPlans = plans.map(plan => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        is_popular: plan.is_popular,
        currency: plan.currency,
        billing_cycle: plan.billing_cycle,
        rzp_plan_id: plan.rzp_plan_id,
        created_at: plan.created_at,
        features: plan.subscriptionFeatures.map(spf => spf.features)
      }));

      return formattedPlans;

    } catch (error) {
      throw error;
    }
  }

  async subscribe(user_id: bigint, plan_id: bigint) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: {
          created_by: user_id,
        }
      })
      if (!org) {
        throw new BadRequestException("User do not have any organization")
      }
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

      const paymentSettings =
        await this.settingsService.paymentSettings("payment-settings");
      console.log("paymentSettings", paymentSettings);

      const DEFAULT_TRIAL_DAYS =
        parseInt(paymentSettings.TRIAL_DURATION) || 0;

      const hasSubscribedBefore = await this.prisma.organizationSubscription.findFirst({
        where: { org_id: org.id },
        select: { id: true },
      });

      const TRIAL_DAYS = hasSubscribedBefore ? 0 : DEFAULT_TRIAL_DAYS;
      const TEN_YEARS = 10;

      // const startAt = addDays(TRIAL_DAYS, 5);
      // const endAt = addYearsFrom(startAt, TEN_YEARS);

      function addMinutes(minutes: number): number {
        return Math.floor(
          (Date.now() + minutes * 60 * 1000) / 1000
        );
      }
      const startAt =
        TRIAL_DAYS > 0 ? addDays(TRIAL_DAYS, 5) : addMinutes(3);
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
      try {
        const rzpSub = await this.razorpay.subscriptions.create(rzpPayload);
        console.log("rzpSub+++++++++", rzpSub);

        const orgSubscription =
          await this.prisma.organizationSubscription.create({
            data: {
              org_id: org?.id,
              plan_id: plan.id,
              status: "INCOMPLETE",
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
      console.log("error", error);
      throw error
    }
  }


  async upgradeSubscription(agent_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { new_plan_id } = payload;

      const org = await this.prisma.organization.findUnique({
        where: {
          created_by: agent_id,
        }
      })
      if (!org) {
        throw new BadRequestException("User do not have any organization")
      }

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

        const cancel = await this.razorpay.subscriptions.cancel(
          currentSub.rzp_subscription_id,
          false
          // { cancel_at_cycle_end: 1 }
        );

        const startAt = addDays(0, 2);
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

  private formatReadableDate(ts?: number | null) {
    return ts
      ? new Date(ts * 1000).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : null;
  }


  async subscriptionPayment(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { subscription_id, payment_id, payment_signature } = payload;

      if (!subscription_id || !payment_id || !payment_signature) {
        throw new BadRequestException("Missing required payment information");
      }

      /* ---------------- VERIFY SIGNATURE ---------------- */
      const generatedSignature = crypto
        .createHmac("sha256", this.razorpaySecret)
        .update(`${payment_id}|${subscription_id}`)
        .digest("hex");
      console.log("generatedSignature", generatedSignature);

      if (generatedSignature !== payment_signature) {
        throw new BadRequestException("Invalid payment signature");
      }

      const rzpSubscription =
        await this.razorpay.subscriptions.fetch(subscription_id);

      console.log("rzpSubscription", rzpSubscription);

      /* ---------------- FIND ORG SUBSCRIPTION ---------------- */
      const orgSubscription =
        await this.prisma.organizationSubscription.findUnique({
          where: { rzp_subscription_id: subscription_id },
        });

      if (!orgSubscription) {
        throw new NotFoundException("Subscription not found");
      }
      console.log("orgSubscription", orgSubscription);

      /* ---------------- IDP CHECK (SAFETY) ---------------- */
      if (orgSubscription.rzp_payment_id) {
        return true;
      }

      /* ---------------- UPDATE AS INCOMPLETE ---------------- */
      await this.prisma.organizationSubscription.update({
        where: { id: orgSubscription.id },
        data: {
          status: "PENDING",
          rzp_payment_id: payment_id,
          signature: payment_signature,
          last_reconciled_at: new Date(),
        },
      });

      const rzpSub = await this.prisma.razorpaySubscription.findFirst({
        where: { rzp_subscription_id: subscription_id }
      });

      /* ---------------- OPTIONAL EVENT LOG ---------------- */
      await this.prisma.razorpayEvent.create({
        data: {
          razorpay_entity_id: subscription_id,
          entity_type: "SUBSCRIPTION",
          event_type: "manual.payment.confirmed",
          payload: payload,
          subscription_id: rzpSub?.id,
        },
      });

      const response = {
        subscription_id: rzpSubscription.id,
        status: rzpSubscription.status,
        created_at: this.formatReadableDate(rzpSubscription.created_at),
        start_at: this.formatReadableDate(rzpSubscription.start_at),
        end_at: this.formatReadableDate(rzpSubscription.end_at),
        first_charge_at: this.formatReadableDate(rzpSubscription.charge_at),
        trial_days: rzpSubscription.notes?.trial_days
          ? Number(rzpSubscription.notes.trial_days)
          : 0,
        total_cycles: rzpSubscription.total_count,
        remaining_cycles: rzpSubscription.remaining_count,
        paid_cycles: rzpSubscription.paid_count,
        payment_method: rzpSubscription.payment_method,
      };

      return response;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }


  async razorpayWebhook(body: Buffer, signature: string) {
    try {
      const paymentSettings = await this.settingsService.paymentSettings("payment-settings");
      const expected = crypto
        .createHmac("sha256", paymentSettings.RAZORPAY_WEBHOOK_SECRET)
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
        case "subscription.activated": {
          const startAt = subscription.start_at
            ? new Date(subscription.start_at * 1000)
            : new Date();

          const endAt = subscription.end_at
            ? new Date(subscription.end_at * 1000)
            : null;

          await this.prisma.organizationSubscription.update({
            where: { rzp_subscription_id: subId },
            data: {
              status: "ACTIVE",
              start_at: startAt,
              end_at: endAt,
            },
          });
          break;
        }

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
              end_at: new Date(),
              cancelled_at: new Date()
            }
          });
          break;

        case "subscription.cancelled":
        case "subscription.halted":
          {
            const orgSub =
              await this.prisma.organizationSubscription.findUnique({
                where: { rzp_subscription_id: subId },
              });
            if (!orgSub || orgSub.status === "UPGRADED") return;

            const effectiveEndAt = subscription.current_end
              ? new Date(subscription.current_end * 1000)
              : new Date();

            await this.prisma.organizationSubscription.update({
              where: { rzp_subscription_id: subId },
              data: {
                auto_renew: false,
                end_at: effectiveEndAt,
              },
            });
            break;
          }
      }

    } catch (error) {
      throw error;
    }
  }

  async getSubscriptionDetails(user_id: bigint) {
    try {
      /* ---------- ORGANIZATION ---------- */
      const org = await this.prisma.organization.findUnique({
        where: { created_by: user_id },
        select: { id: true },
      });

      if (!org) {
        throw new BadRequestException("User does not own any organization");
      }

      /* ---------- ALL SUBSCRIPTIONS ---------- */
      const subscriptions = await this.prisma.organizationSubscription.findMany({
        where: {
          org_id: org.id,
        },
        select: {
          id: true,
          rzp_subscription_id: true,
          rzp_payment_id: true,
          auto_renew: true,
          source: true,
          status: true,
          start_at: true,
          end_at: true,
          created_at: true,
          cancelled_at: true,
          plan: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
              price: true,
              currency: {
                select: {
                  code: true,
                  symbol: true,
                },
              },
              subscriptionFeatures: {
                select: {
                  features: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });
      const activeSubscription: any = subscriptions.find(
        (sub) => sub.status === "ACTIVE" && sub.rzp_subscription_id
      );

      const rzpSubscription = activeSubscription
        ? await this.razorpay.subscriptions.fetch(
          activeSubscription?.rzp_subscription_id
        )
        : null;
      console.log("rzpSubscription", rzpSubscription);

      const formattedSubscriptions = subscriptions.map((sub) => ({
        id: Number(sub.id),
        status: sub.status,
        source: sub.source,
        startAt: sub.start_at,
        endAt: sub.end_at,
        plan: {
          id: Number(sub.plan.id),
          code: sub.plan.code,
          name: sub.plan.name,
          description: sub.plan.description,
          price: sub.plan.price,
          currency: {
            code: sub.plan.currency.code,
            symbol: sub.plan.currency.symbol,
          },
          features: sub.plan.subscriptionFeatures.map(
            (f) => f.features
          ),
        },
      }));

      return {
        subscriptions: formattedSubscriptions,
        activeSubscriptionRazorpay: rzpSubscription
          ? {
            subscriptionId: rzpSubscription.id,
            status: rzpSubscription.status,
            paymentMethod: rzpSubscription.payment_method,
            totalCycles: rzpSubscription.total_count,
            paidCycles: rzpSubscription.paid_count,
            remainingCycles: rzpSubscription.remaining_count,
            chargeAt: rzpSubscription.charge_at
              ? new Date(rzpSubscription.charge_at * 1000)
              : null,
            startAt: rzpSubscription.start_at
              ? new Date(rzpSubscription.start_at * 1000)
              : null,
            endAt: rzpSubscription.end_at
              ? new Date(rzpSubscription.end_at * 1000)
              : null,
            shortUrl: rzpSubscription.short_url,
          }
          : null,
      };
    } catch (error) {
      throw error;
    }
  }



  // async cancelSubscription(user_id: bigint) {
  //   try {
  //     const org = await this.prisma.organization.findUnique({
  //       where: { created_by: user_id },
  //       select: { id: true },
  //     });

  //     if (!org) {
  //       throw new BadRequestException("User does not own any organization");
  //     }

  //     const orgSubscription =
  //       await this.prisma.organizationSubscription.findFirst({
  //         orderBy: {
  //           created_at: "desc"
  //         },
  //         where: {
  //           org_id: org.id,
  //           status: "ACTIVE",
  //         },
  //       });

  //     if (!orgSubscription || !orgSubscription.rzp_subscription_id) {
  //       throw new BadRequestException("No active subscription found");
  //     }

  //     try {
  //       await this.razorpay.subscriptions.cancel(
  //         orgSubscription.rzp_subscription_id,
  //         true
  //       );
  //     } catch (error: any) {
  //       console.error("Razorpay cancel error:", error?.error || error);
  //       throw new BadRequestException("Failed to cancel subscription on Razorpay");
  //     }

  //     await this.prisma.organizationSubscription.update({
  //       where: {
  //         id: orgSubscription.id,
  //       },
  //       data: {
  //         auto_renew: false,
  //       },
  //     });

  //     return true;
  //   } catch (error) {
  //     throw error;
  //   }
  // }


  async cancelSubscription(user_id: bigint) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { created_by: user_id },
        select: { id: true },
      });

      if (!org) return;

      const orgSubscription =
        await this.prisma.organizationSubscription.findFirst({
          orderBy: { created_at: "desc" },
          where: {
            org_id: org.id,
            status: "ACTIVE",
          },
        });

      if (!orgSubscription?.rzp_subscription_id) return;

      let rzpSub: any;

      try {
        rzpSub = await this.razorpay.subscriptions.fetch(
          orgSubscription.rzp_subscription_id
        );
      } catch (error) {
        console.error("[RAZORPAY_FETCH_FAILED]", error?.error || error);
        return;
      }

      try {
        if (rzpSub.paid_count === 0) {
          await this.razorpay.subscriptions.pause(
            orgSubscription.rzp_subscription_id
          );
          await this.prisma.organizationSubscription.update({
            where: { id: orgSubscription.id },
            data: {
              auto_renew: false,
              cancelled_at: new Date(),
              end_at: new Date()
            },
          });
        } else {
          await this.razorpay.subscriptions.cancel(
            orgSubscription.rzp_subscription_id,
            true
          );
          await this.prisma.organizationSubscription.update({
            where: { id: orgSubscription.id },
            data: {
              auto_renew: false,
              cancelled_at: new Date()
            },
          });
        }
      } catch (error: any) {
        console.error(
          "[RAZORPAY_TERMINATION_FAILED]",
          error?.error || error
        );
      }
      return true;
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
