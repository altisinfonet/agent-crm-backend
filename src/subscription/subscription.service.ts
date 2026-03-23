import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { addDays, addYearsFrom, decryptData } from '@/common/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { SettingsService } from 'src/settings/settings.service';
import Razorpay = require("razorpay");
import * as crypto from "crypto";
import { SubscriptionCycle } from '@generated/prisma';
import { clearCurrentUserCache } from '@/common/helper/current-user-cache.helper';

@Injectable()
export class SubscriptionService {
  // private razorpay: Razorpay;
  // private razorpaySecret: string;
  constructor(
    private prisma: PrismaService,
    private readonly settingsService: SettingsService
  ) { }
  // async onModuleInit() {
  //   await this.initRazorpay();
  // }
  // private async initRazorpay() {
  //   const RazorpaySetting = await this.settingsService.paymentSettings("payment-settings");

  //   this.razorpaySecret = RazorpaySetting.RAZORPAY_KEY_SECRET;
  //   this.razorpay = new Razorpay({
  //     key_id: RazorpaySetting.RAZORPAY_KEY_ID,
  //     key_secret: RazorpaySetting.RAZORPAY_KEY_SECRET,
  //   });
  // }

  private async getRazorpayInstance(): Promise<Razorpay> {
    const settings =
      await this.settingsService.paymentSettings("payment-settings");

    return new Razorpay({
      key_id: settings.RAZORPAY_KEY_ID,
      key_secret: settings.RAZORPAY_KEY_SECRET,
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

  private getEndAtByBillingCycle(
    startAt: number,
    billingCycle: SubscriptionCycle
  ): number {
    const endAt = new Date(startAt * 1000);

    switch (billingCycle) {
      case 'YEARLY':
        endAt.setFullYear(endAt.getFullYear() + 1);
        break;

      case 'QUARTERLY':
        endAt.setMonth(endAt.getMonth() + 3);
        break;

      case 'MONTHLY':
        endAt.setMonth(endAt.getMonth() + 1);
        break;

      case 'WEEKLY':
        endAt.setDate(endAt.getDate() + 7);
        break;

      default:
        throw new Error(`Unsupported billing cycle: ${billingCycle}`);
    }
    return Math.floor(endAt.getTime() / 1000);
  }

  // async subscribe(user_id: bigint, plan_id: bigint) {
  //   try {
  //     const org = await this.prisma.organization.findUnique({
  //       where: {
  //         created_by: user_id,
  //       }
  //     })
  //     if (!org) {
  //       throw new BadRequestException("User do not have any organization")
  //     }
  //     const plan = await this.prisma.subscriptionPlan.findFirst({
  //       where: {
  //         id: plan_id,
  //         is_active: true
  //       }
  //     });
  //     if (!plan || !plan?.rzp_plan_id) {
  //       throw new BadRequestException("Invalid or inactive plan");
  //     }
  //     const existing = await this.prisma.organizationSubscription.findFirst({
  //       where: {
  //         org_id: org?.id,
  //         status: "ACTIVE"
  //       }
  //     });
  //     if (existing) {
  //       throw new BadRequestException("Organization already has an active subscription");
  //     }

  //     const paymentSettings =
  //       await this.settingsService.paymentSettings("payment-settings");

  //     const DEFAULT_TRIAL_DAYS =
  //       parseInt(paymentSettings.TRIAL_DURATION) || 0;

  //     const hasSubscribedBefore = await this.prisma.organizationSubscription.findFirst({
  //       where: {
  //         org_id: org.id,
  //         status: {
  //           notIn: ["INCOMPLETE"]
  //         },
  //       },
  //       select: { id: true },
  //     });

  //     const TRIAL_DAYS = hasSubscribedBefore ? 0 : DEFAULT_TRIAL_DAYS;

  //     const billing_cycle = plan.billing_cycle;

  //     const startAt =
  //       TRIAL_DAYS > 0 ? addDays(TRIAL_DAYS, 5) : this.addMinutes(2);
  //     const endAt = this.getEndAtByBillingCycle(
  //       startAt,
  //       billing_cycle
  //     );

  //     const rzpPayload: any = {
  //       plan_id: plan.rzp_plan_id,
  //       start_at: startAt,
  //       end_at: endAt,
  //       customer_notify: 1,
  //       notes: {
  //         org_id: org.id.toString(),
  //         plan_code: plan.code,
  //         trial_days: TRIAL_DAYS.toString()
  //       }
  //     };
  //     try {
  //       const rzpSub = await this.razorpay.subscriptions.create(rzpPayload);

  //       const orgSubscription =
  //         await this.prisma.organizationSubscription.create({
  //           data: {
  //             org_id: org?.id,
  //             plan_id: plan.id,
  //             status: "INCOMPLETE",
  //             start_at: new Date(),
  //             auto_renew: true,
  //             rzp_subscription_id: rzpSub?.id
  //           }
  //         });

  //       await this.prisma.razorpaySubscription.create({
  //         data: {
  //           org_subscription_id: orgSubscription.id,
  //           rzp_subscription_id: rzpSub.id,
  //           rzp_plan_id: rzpSub.plan_id,
  //           status: rzpSub.status,
  //           total_count: rzpSub.total_count ?? null,
  //           current_cycle: rzpSub.paid_count ?? 0,
  //           start_at: rzpSub.start_at
  //             ? new Date(rzpSub.start_at * 1000)
  //             : null,
  //           end_at: rzpSub.end_at
  //             ? new Date(rzpSub.end_at * 1000)
  //             : null
  //         }
  //       });
  //       return {
  //         subscription_id: rzpSub.id
  //       };
  //     } catch (error: any) {
  //       console.error("Razorpay error:", error?.error || error);
  //       throw error;
  //     }

  //   } catch (error) {
  //     console.log("error", error);
  //     throw error
  //   }
  // }


  private async createFreeTrialSubscription(
    orgId: bigint,
    planId: bigint,
    trialDays: number,
  ) {
    const startAt = new Date();
    const endAt = new Date();
    endAt.setDate(endAt.getDate() + trialDays);

    return this.prisma.organizationSubscription.create({
      data: {
        org_id: orgId,
        plan_id: planId,
        status: 'TRIAL',
        source: 'FREE',
        start_at: startAt,
        end_at: endAt,
        auto_renew: false,
      },
    });
  }

  async subscribe(user_id: bigint, plan_id: bigint) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { created_by: user_id },
      });

      if (!org) {
        throw new BadRequestException('User does not have any organization');
      }

      const plan = await this.prisma.subscriptionPlan.findFirst({
        where: {
          id: plan_id,
          is_active: true,
        },
      });

      if (!plan || !plan.rzp_plan_id) {
        throw new BadRequestException('Invalid or inactive plan');
      }

      const hasSubscribedBefore =
        await this.prisma.organizationSubscription.findFirst({
          where: {
            org_id: org.id,
            status: {
              notIn: ['INCOMPLETE'],
            },
          },
          select: { id: true },
        });

      if (!hasSubscribedBefore) {
        const paymentSettings =
          await this.settingsService.paymentSettings('payment-settings');

        const TRIAL_DAYS =
          parseInt(paymentSettings.TRIAL_DURATION) || 7;

        await this.createFreeTrialSubscription(
          org.id,
          plan.id,
          TRIAL_DAYS,
        );

        await this.invalidateCurrentUserCache(user_id);
        return {
          status: 'TRIAL',
          subscription_id: null
        };
      }

      const existing = await this.prisma.organizationSubscription.findFirst({
        where: {
          org_id: org.id,
          status: {
            in: ["ACTIVE", "PENDING"]
          },
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Organization already has an active subscription',
        );
      }

      const billing_cycle = plan.billing_cycle;
      const startAt = this.addMinutes(2);
      const endAt = this.getEndAtByBillingCycle(startAt, billing_cycle);

      const rzpPayload: any = {
        plan_id: plan.rzp_plan_id,
        start_at: startAt,
        end_at: endAt,
        customer_notify: 1,
        notes: {
          org_id: org.id.toString(),
          plan_code: plan.code,
          trial_days: '0',
        },
      };
      const razorpay = await this.getRazorpayInstance();

      const rzpSub = await razorpay.subscriptions.create(rzpPayload);

      const orgSubscription =
        await this.prisma.organizationSubscription.create({
          data: {
            org_id: org?.id,
            plan_id: plan.id,
            status: "INCOMPLETE",
            start_at: rzpSub.start_at
              ? new Date(rzpSub.start_at * 1000)
              : new Date(),
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
            : null,
        },
      });

      await this.invalidateCurrentUserCache(user_id);
      return {
        subscription_id: rzpSub.id,
      };
    } catch (error) {
      throw error;
    }
  }

  private addMinutes(minutes: number): number {
    return Math.floor(
      (Date.now() + minutes * 60 * 1000) / 1000
    );
  }

  private async invalidateCurrentUserCache(userId: bigint) {
    await clearCurrentUserCache(userId);
  }

  private async invalidateCurrentUserCacheByOrgId(orgId: bigint) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { created_by: true },
    });

    if (!organization) {
      return;
    }

    await this.invalidateCurrentUserCache(organization.created_by);
  }

  private async invalidateCurrentUserCacheBySubscriptionId(subscriptionId: string) {
    const orgSubscription = await this.prisma.organizationSubscription.findUnique({
      where: { rzp_subscription_id: subscriptionId },
      select: { org_id: true },
    });

    if (!orgSubscription) {
      return;
    }

    await this.invalidateCurrentUserCacheByOrgId(orgSubscription.org_id);
  }

  async upgradeSubscription(agent_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { new_plan_id } = payload;

      if (!new_plan_id) {
        throw new BadRequestException("New plan Id required");
      }

      const org = await this.prisma.organization.findUnique({
        where: {
          created_by: agent_id,
        }
      })
      if (!org) {
        throw new BadRequestException("User does not have any organization");
      }

      const currentSub =
        await this.prisma.organizationSubscription.findFirst({
          where: {
            org_id: org.id,
            status: "ACTIVE",
          },
          include: { plan: true },
        });

      if (!currentSub || !currentSub.rzp_subscription_id) {
        throw new BadRequestException("No active subscription found");
      }

      const newPlan =
        await this.prisma.subscriptionPlan.findFirst({
          where: {
            id: new_plan_id,
            is_active: true,
          },
        });

      if (!newPlan || !newPlan.rzp_plan_id) {
        throw new BadRequestException("Invalid plan");
      }

      const paymentSettings =
        await this.settingsService.paymentSettings("payment-settings");

      const DEFAULT_TRIAL_DAYS =
        parseInt(paymentSettings.TRIAL_DURATION) || 0;

      const hasSubscribedBefore = await this.prisma.organizationSubscription.findFirst({
        where: {
          org_id: org.id,
          status: {
            notIn: ["INCOMPLETE"]
          },
        },
        select: { id: true },
      });

      const TRIAL_DAYS = hasSubscribedBefore ? 0 : DEFAULT_TRIAL_DAYS;
      // const TEN_YEARS = 10;

      // const startAt =
      //   TRIAL_DAYS > 0 ? addDays(TRIAL_DAYS, 5) : this.addMinutes(3);
      // const endAt = addYearsFrom(startAt, TEN_YEARS);

      const billing_cycle = newPlan.billing_cycle;
      const startAt =
        TRIAL_DAYS > 0 ? addDays(TRIAL_DAYS, 5) : this.addMinutes(2);
      const endAt = this.getEndAtByBillingCycle(
        startAt,
        billing_cycle
      );

      const rzpPayload: any = {
        plan_id: newPlan.rzp_plan_id,
        start_at: startAt,
        end_at: endAt,
        customer_notify: 1,
        notes: {
          org_id: org.id.toString(),
          upgraded_from: currentSub.plan.code,
          upgraded_to: newPlan.code,
        },
      };

      const razorpay = await this.getRazorpayInstance();

      const rzpSub = await razorpay.subscriptions.create(rzpPayload);
      const newOrgSub =
        await this.prisma.organizationSubscription.create({
          data: {
            org_id: org.id,
            plan_id: newPlan.id,
            status: "INCOMPLETE",
            rzp_subscription_id: rzpSub.id,
            upgraded_from_id: currentSub.id,
            start_at: new Date(),
          },
        });

      await this.prisma.organizationSubscription.update({
        where: { id: currentSub.id },
        data: {
          upgraded_at: new Date(),
          upgraded_to_id: newOrgSub.id,
        },
      });

      await this.invalidateCurrentUserCache(agent_id);
      return {
        subscription_id: rzpSub.id,
      };
    } catch (error) {
      throw error;
    }
  }

  // async upgradeSubscription(agent_id: bigint, dto: CommonDto) {
  //   try {
  //     const payload = decryptData(dto.data);
  //     const { new_plan_id } = payload;

  //     if (!new_plan_id) {
  //       throw new BadRequestException("New plan Id required");
  //     }

  //     const org = await this.prisma.organization.findUnique({
  //       where: { created_by: agent_id },
  //     });

  //     if (!org) {
  //       throw new BadRequestException("User does not have any organization");
  //     }

  //     const currentSub =
  //       await this.prisma.organizationSubscription.findFirst({
  //         where: {
  //           org_id: org.id,
  //           status: "ACTIVE",
  //         },
  //         include: { plan: true },
  //       });

  //     if (!currentSub || !currentSub.rzp_subscription_id) {
  //       throw new BadRequestException("No active subscription found");
  //     }

  //     const newPlan =
  //       await this.prisma.subscriptionPlan.findFirst({
  //         where: {
  //           id: new_plan_id,
  //           is_active: true,
  //         },
  //       });

  //     if (!newPlan || !newPlan.rzp_plan_id) {
  //       throw new BadRequestException("Invalid plan");
  //     }

  //     const rzpUpdatePayload = {
  //       plan_id: newPlan.rzp_plan_id,
  //       remaining_count: 1,
  //       schedule_change_at: "cycle_end" as const,
  //       customer_notify: true,
  //       // notes: {
  //       //   org_id: org.id.toString(),
  //       //   upgraded_from: currentSub.plan.code,
  //       //   upgraded_to: newPlan.code,
  //       // },
  //     };
  //     const razorpay = await this.getRazorpayInstance();

  //     const updatedRzpSub =
  //       await razorpay.subscriptions.update(
  //         currentSub.rzp_subscription_id,
  //         rzpUpdatePayload
  //       );

  //     await this.prisma.organizationSubscription.update({
  //       where: { id: currentSub.id },
  //       data: {
  //         plan_id: newPlan.id,
  //         status: "ACTIVE",
  //       },
  //     });

  //     return {
  //       subscription_id: updatedRzpSub.id,
  //       status: updatedRzpSub.status,
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

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
      const subscription = await this.prisma.organizationSubscription.findFirst({
        where: {
          rzp_subscription_id: subscription_id
        },
      })

      if (subscription_id && !payment_id && subscription?.status === "INCOMPLETE") {
        await this.prisma.razorpaySubscription.delete({
          where: {
            rzp_subscription_id: subscription_id
          },
        })
        await this.prisma.organizationSubscription.delete({
          where: {
            rzp_subscription_id: subscription_id
          },
        })
        const payload = {
          subscription_id,
          payment_id,
          payment_signature
        }
        await this.prisma.razorpayEvent.create({
          data: {
            razorpay_entity_id: subscription_id,
            entity_type: "SUBSCRIPTION",
            event_type: "incomplete.subscription_request.deleted",
            payload,
          }
        })

        if (subscription?.org_id) {
          await this.invalidateCurrentUserCacheByOrgId(subscription.org_id);
        }
      }

      if (!subscription_id || !payment_id || !payment_signature) {
        throw new BadRequestException("Missing required payment information");
      }
      const settings =
        await this.settingsService.paymentSettings("payment-settings");
      const razorpay = await this.getRazorpayInstance();

      /* ---------------- VERIFY SIGNATURE ---------------- */
      const generatedSignature = crypto
        .createHmac("sha256", settings?.RAZORPAY_KEY_SECRET)
        .update(`${payment_id}|${subscription_id}`)
        .digest("hex");

      if (generatedSignature !== payment_signature) {
        throw new BadRequestException("Invalid payment signature");
      }

      const rzpSubscription =
        await razorpay.subscriptions.fetch(subscription_id);

      /* ---------------- FIND ORG SUBSCRIPTION ---------------- */
      const orgSubscription =
        await this.prisma.organizationSubscription.findUnique({
          where: { rzp_subscription_id: subscription_id },
        });

      if (!orgSubscription) {
        throw new NotFoundException("Subscription not found");
      }

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

      await this.invalidateCurrentUserCacheBySubscriptionId(subscription_id);

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


  // async razorpayWebhook(body: Buffer, signature: string) {
  //   try {
  //     const paymentSettings = await this.settingsService.paymentSettings("payment-settings");
  //     const expected = crypto
  //       .createHmac("sha256", paymentSettings.RAZORPAY_WEBHOOK_SECRET)
  //       .update(body)
  //       .digest("hex");

  //     if (expected !== signature) {
  //       throw new Error("Invalid Razorpay webhook signature");
  //     }

  //     const event = JSON.parse(body.toString());

  //     const eventType = event.event;
  //     const subscription = event.payload.subscription?.entity;

  //     if (!subscription) return;
  //     const subId = subscription.id;

  //     await this.prisma.razorpayEvent.create({
  //       data: {
  //         razorpay_entity_id: subId,
  //         entity_type: "SUBSCRIPTION",
  //         event_type: eventType,
  //         payload: event
  //       }
  //     });

  //     switch (eventType) {
  //       case "subscription.authenticated":
  //       case "subscription.activated": {
  //         const startAt = subscription.start_at
  //           ? new Date(subscription.start_at * 1000)
  //           : new Date();

  //         const endAt = subscription.end_at
  //           ? new Date(subscription.end_at * 1000)
  //           : null;

  //         await this.prisma.organizationSubscription.update({
  //           where: { rzp_subscription_id: subId },
  //           data: {
  //             status: "ACTIVE",
  //             start_at: startAt,
  //             end_at: endAt,
  //           },
  //         });
  //         break;
  //       }

  //       case "subscription.charged":
  //         await this.prisma.razorpaySubscription.update({
  //           where: { rzp_subscription_id: subId },
  //           data: {
  //             current_cycle: { increment: 1 }
  //           }
  //         });
  //         break;

  //       case "subscription.completed":
  //         await this.prisma.organizationSubscription.update({
  //           where: { rzp_subscription_id: subId },
  //           data: {
  //             status: "EXPIRED",
  //             end_at: new Date(),
  //             cancelled_at: new Date()
  //           }
  //         });
  //         break;

  //       case "subscription.cancelled":
  //       case "subscription.halted":
  //         {
  //           const orgSub =
  //             await this.prisma.organizationSubscription.findUnique({
  //               where: { rzp_subscription_id: subId },
  //             });
  //           if (!orgSub || orgSub.status === "UPGRADED") return;

  //           const effectiveEndAt = subscription.current_end
  //             ? new Date(subscription.current_end * 1000)
  //             : new Date();

  //           await this.prisma.organizationSubscription.update({
  //             where: { rzp_subscription_id: subId },
  //             data: {
  //               auto_renew: false,
  //               end_at: effectiveEndAt,
  //             },
  //           });
  //           break;
  //         }
  //     }

  //   } catch (error) {
  //     throw error;
  //   }
  // }


  // async razorpayWebhook(body: Buffer, signature: string) {
  //   try {
  //     const paymentSettings =
  //       await this.settingsService.paymentSettings("payment-settings");

  //     const expected = crypto
  //       .createHmac("sha256", paymentSettings.RAZORPAY_WEBHOOK_SECRET)
  //       .update(body)
  //       .digest("hex");

  //     if (expected !== signature) {
  //       throw new Error("Invalid Razorpay webhook signature");
  //     }

  //     const event = JSON.parse(body.toString());

  //     const eventType = event.event;
  //     const subscription = event.payload.subscription?.entity;

  //     if (!subscription) return;
  //     const subId = subscription.id;

  //     await this.prisma.razorpayEvent.create({
  //       data: {
  //         razorpay_entity_id: subId,
  //         entity_type: "SUBSCRIPTION",
  //         event_type: eventType,
  //         payload: event,
  //       },
  //     });

  //     switch (eventType) {
  //       /* ---------- AUTHENTICATED / ACTIVATED ---------- */
  //       case "subscription.authenticated":
  //       case "subscription.activated": {
  //         const orgSub =
  //           await this.prisma.organizationSubscription.findUnique({
  //             where: { rzp_subscription_id: subId },
  //           });

  //         if (!orgSub) return;

  //         const startAt = subscription.start_at
  //           ? new Date(subscription.start_at * 1000)
  //           : orgSub.start_at;

  //         const endAt = subscription.end_at
  //           ? new Date(subscription.end_at * 1000)
  //           : orgSub.end_at;

  //         await this.prisma.organizationSubscription.update({
  //           where: { id: orgSub.id },
  //           data: {
  //             status: "ACTIVE",
  //             start_at: startAt,
  //             end_at: endAt,
  //             cancelled_at: null,
  //           },
  //         });
  //         break;
  //       }

  //       /* ---------- CHARGED ---------- */
  //       case "subscription.charged": {
  //         await this.prisma.razorpaySubscription.updateMany({
  //           where: { rzp_subscription_id: subId },
  //           data: {
  //             current_cycle: { increment: 1 },
  //           },
  //         });
  //         break;
  //       }

  //       /* ---------- COMPLETED ---------- */
  //       case "subscription.completed": {
  //         await this.prisma.organizationSubscription.update({
  //           where: { rzp_subscription_id: subId },
  //           data: {
  //             status: "EXPIRED",
  //             end_at: new Date(),
  //             auto_renew: false,
  //           },
  //         });
  //         break;
  //       }

  //       /* ---------- CANCELLED ---------- */

  //       case "subscription.cancelled": {
  //         const currentEnd = subscription.current_end
  //           ? new Date(subscription.current_end * 1000)
  //           : new Date();

  //         const now = new Date();
  //         const isImmediateCancel = currentEnd <= now;

  //         await this.prisma.organizationSubscription.update({
  //           where: { rzp_subscription_id: subId },
  //           data: {
  //             status: isImmediateCancel ? "CANCELLED" : "ACTIVE",
  //             auto_renew: false,
  //             end_at: currentEnd,
  //             cancelled_at: new Date(),
  //           },
  //         });
  //         break;
  //       }

  //       case "subscription.halted": {
  //         await this.prisma.organizationSubscription.update({
  //           where: { rzp_subscription_id: subId },
  //           data: {
  //             status: "PAUSED",
  //             auto_renew: false,
  //           },
  //         });
  //         break;
  //       }
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // }

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
          payload: event,
        },
      });

      switch (eventType) {
        /* ---------------- AUTHENTICATED / ACTIVATED ---------------- */
        case "subscription.authenticated":
        case "subscription.activated": {
          const orgSub =
            await this.prisma.organizationSubscription.findUnique({
              where: { rzp_subscription_id: subId },
              include: { upgraded_from: true },
            });

          if (!orgSub) return;

          const startAt = subscription.start_at
            ? new Date(subscription.start_at * 1000)
            : new Date();

          const endAt = subscription.end_at
            ? new Date(subscription.end_at * 1000)
            : null;

          /* Activate NEW subscription */
          await this.prisma.organizationSubscription.update({
            where: { id: orgSub.id },
            data: {
              status: "ACTIVE",
              start_at: startAt,
              end_at: endAt,
            },
          });
          const razorpay = await this.getRazorpayInstance();

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
              },
            });
          }

          await this.invalidateCurrentUserCacheBySubscriptionId(subId);
          break;
        }

        /* ---------------- CHARGED ---------------- */
        case "subscription.charged":
          await this.prisma.razorpaySubscription.update({
            where: { rzp_subscription_id: subId },
            data: {
              current_cycle: { increment: 1 },
            },
          });
          break;

        /* ---------------- COMPLETED ---------------- */
        case "subscription.completed":
          await this.prisma.organizationSubscription.update({
            where: { rzp_subscription_id: subId },
            data: {
              status: "EXPIRED",
              end_at: new Date(),
              cancelled_at: new Date(),
              auto_renew: false,
            },
          });
          await this.invalidateCurrentUserCacheBySubscriptionId(subId);
          break;

        /* ---------------- CANCELLED / HALTED ---------------- */

        case "subscription.cancelled": {
          const orgSub =
            await this.prisma.organizationSubscription.findUnique({
              where: { rzp_subscription_id: subId },
            });
          if (!orgSub || orgSub.status === "UPGRADED") return;

          const currentEnd = subscription.current_end
            ? new Date(subscription.current_end * 1000)
            : new Date();

          const now = new Date();
          const isImmediateCancel = currentEnd <= now;

          await this.prisma.organizationSubscription.update({
            where: { rzp_subscription_id: subId },
            data: {
              status: isImmediateCancel ? "CANCELLED" : "ACTIVE",
              auto_renew: false,
              end_at: currentEnd,
            },
          });
          await this.invalidateCurrentUserCacheBySubscriptionId(subId);
          break;
        }

        case "subscription.halted": {
          await this.prisma.organizationSubscription.update({
            where: { rzp_subscription_id: subId },
            data: {
              status: "PAUSED",
              auto_renew: false,
            },
          });
          await this.invalidateCurrentUserCacheBySubscriptionId(subId);
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
          status: {
            notIn: ["INCOMPLETE"]
          },
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
              rzp_plan_id: true,
              code: true,
              name: true,
              description: true,
              price: true,
              billing_cycle: true,
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
      const razorpay = await this.getRazorpayInstance();

      const rzpSubscription = activeSubscription
        ? await razorpay.subscriptions.fetch(
          activeSubscription?.rzp_subscription_id
        )
        : null;

      const formattedSubscriptions = await Promise.all(
        subscriptions.map(async (sub) => {

          const trialDays = this.calculateTrialDays(
            sub.status,
            sub.created_at,
            sub.start_at,
            sub.end_at
          );

          let invoiceUrls: any[] = [];

          if (sub.rzp_subscription_id) {
            try {
              const invoices = await razorpay.invoices.all({
                subscription_id: sub.rzp_subscription_id,
              });

              invoiceUrls = invoices.items.map((invoice: any) => ({
                invoice_url: invoice.short_url,
              }));
            } catch (err) {
              console.log("Invoice fetch failed for:", sub.rzp_subscription_id);
            }
          }

          return {
            id: Number(sub.id),
            status: sub.status,
            source: sub.source,
            startAt: sub.start_at,
            endAt: sub.end_at,
            rzp_subscription_id: sub.rzp_subscription_id,
            rzp_payment_id: sub.rzp_payment_id,
            auto_renew: sub.auto_renew,
            created_at: sub.created_at,
            cancelled_at: sub.cancelled_at,
            trialDays,
            plan: {
              id: Number(sub.plan.id),
              code: sub.plan.code,
              name: sub.plan.name,
              description: sub.plan.description,
              price: sub.plan.price,
              rzp_plan_id: sub.plan.rzp_plan_id,
              billing_cycle: sub.plan.billing_cycle,
              currency: {
                code: sub.plan.currency.code,
                symbol: sub.plan.currency.symbol,
              },
              features: sub.plan.subscriptionFeatures.map((f) => f.features),
            },
            invoices: invoiceUrls,
          };
        })
      );

      let invoiceUrls: any[] = [];
      if (activeSubscription?.rzp_subscription_id) {
        const invoices = await razorpay.invoices.all({
          subscription_id: activeSubscription.rzp_subscription_id,
        });

        invoiceUrls = invoices.items.map((invoice: any) => ({
          invoice_url: invoice.short_url,
        }));
      }

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
            invoice_url: invoiceUrls,
            created_at: rzpSubscription.created_at,
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
  //     };

  //     const orgSubscription =
  //       await this.prisma.organizationSubscription.findFirst({
  //         orderBy: { created_at: "desc" },
  //         where: {
  //           org_id: org.id,
  //           status: "ACTIVE",
  //         },
  //       });

  //     if (!orgSubscription) {
  //       throw new BadRequestException("No subscription found for this organization")
  //     }

  //     if (orgSubscription.source === "RAZORPAY" && !orgSubscription?.rzp_subscription_id) {
  //       throw new BadRequestException("No active subscription found");
  //     }

  //     let rzpSub: any;
  //     try {
  //       rzpSub = await this.razorpay.subscriptions.fetch(
  //         orgSubscription.rzp_subscription_id
  //       );
  //     } catch (error) {
  //       console.error("[RAZORPAY_FETCH_FAILED]", error?.error || error);
  //       throw error;
  //     }

  //     try {
  //       if (orgSubscription.source === "RAZORPAY") {
  //         if (rzprzpSubscription.paid_count === 0) {
  //           await this.razorpay.subscriptions.pause(
  //             orgSubscription.rzp_subscription_id
  //           );
  //           await this.prisma.organizationSubscription.update({
  //             where: { id: orgSubscription.id },
  //             data: {
  //               auto_renew: false,
  //               cancelled_at: new Date(),
  //               end_at: new Date()
  //             },
  //           });
  //         } else {
  //           await this.razorpay.subscriptions.cancel(
  //             orgSubscription.rzp_subscription_id,
  //             true
  //           );
  //           await this.prisma.organizationSubscription.update({
  //             where: { id: orgSubscription.id },
  //             data: {
  //               auto_renew: false,
  //               cancelled_at: new Date()
  //             },
  //           });
  //         }
  //       }
  //       else if (orgSubscription.source === "ADMIN") {
  //         await this.prisma.organizationSubscription.update({
  //           where: { id: orgSubscription.id },
  //           data: {
  //             status: "CANCELLED",
  //             auto_renew: false,
  //             cancelled_at: new Date(),
  //             end_at: new Date()
  //           },
  //         });
  //       } else {
  //         throw new BadRequestException("Invalid subscription source")
  //       }
  //     } catch (error: any) {
  //       console.error(
  //         "[RAZORPAY_TERMINATION_FAILED]",
  //         error?.error || error
  //       );
  //     }
  //     return true;
  //   } catch (error) {
  //     console.log("error", error);
  //     throw error;
  //   }
  // }

  async cancelSubscription(user_id: bigint): Promise<boolean> {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { created_by: user_id },
        select: { id: true },
      });

      if (!org) {
        throw new BadRequestException("User does not own any organization");
      }

      const orgSubscription =
        await this.prisma.organizationSubscription.findFirst({
          orderBy: { created_at: "desc" },
          where: {
            org_id: org.id,
            status: "ACTIVE",
          },
        });

      if (!orgSubscription) {
        throw new BadRequestException(
          "No active subscription found for this organization"
        );
      }

      if (orgSubscription.source === "ADMIN") {
        await this.prisma.organizationSubscription.update({
          where: { id: orgSubscription.id },
          data: {
            status: "CANCELLED",
            auto_renew: false,
            cancelled_at: new Date(),
            end_at: new Date(),
          },
        });
        await this.invalidateCurrentUserCache(user_id);
        return true;
      }

      if (
        orgSubscription.source !== "RAZORPAY" ||
        !orgSubscription.rzp_subscription_id
      ) {
        throw new BadRequestException("Invalid or missing subscription");
      }

      let rzpSub: {
        paid_count: number;
        start_at: number
      };
      const razorpay = await this.getRazorpayInstance();

      try {
        rzpSub = await razorpay.subscriptions.fetch(
          orgSubscription.rzp_subscription_id
        );
      } catch (error: any) {
        console.error("[RAZORPAY_FETCH_FAILED]", error?.error || error);
        throw new BadRequestException("Failed to fetch Razorpay subscription");
      }

      try {
        if (rzpSub.paid_count === 0) {
          await razorpay.subscriptions.pause(
            orgSubscription.rzp_subscription_id
          );
          await this.prisma.organizationSubscription.update({
            where: { id: orgSubscription.id },
            data: {
              status: "CANCELLED",
              auto_renew: false,
              cancelled_at: new Date(),
              end_at: new Date(rzpSub.start_at * 1000),
            },
          });
        } else {
          await razorpay.subscriptions.cancel(
            orgSubscription.rzp_subscription_id,
            true
          );
          await this.prisma.organizationSubscription.update({
            where: { id: orgSubscription.id },
            data: {
              auto_renew: false,
              cancelled_at: new Date(),
            },
          });
        }
      } catch (error: any) {
        console.error("[RAZORPAY_TERMINATION_FAILED]", error?.error || error);
        throw new BadRequestException("Failed to cancel subscription");
      }

      await this.invalidateCurrentUserCache(user_id);
      return true;
    } catch (error) {
      console.error("[CANCEL_SUBSCRIPTION_ERROR]", error);
      throw error;
    }
  }

  private calculateTrialDays(
    status: string,
    createdAt: Date,
    startAt: Date | null,
    endAt: Date | null
  ): number {
    let from: Date | null = null;
    let to: Date | null = null;

    if (status === "TRIAL") {
      if (!startAt || !endAt) return 0;
      from = startAt;
      to = endAt;
    } else {
      if (!startAt) return 0;
      from = createdAt;
      to = startAt;
    }

    const diffMs = to.getTime() - from.getTime();
    if (diffMs <= 0) return 0;

    const ONE_DAY_MS = 1000 * 60 * 60 * 24;

    return Math.floor(diffMs / ONE_DAY_MS);
  }


  async getSubscriptionInvoices(user_id: bigint, subscription_id: bigint) {
    try {

      const org = await this.prisma.organization.findUnique({
        where: { created_by: user_id },
        select: { id: true },
      });

      if (!org) {
        throw new BadRequestException("User does not own any organization");
      }

      if (!subscription_id) {
        throw new BadRequestException(
          "Subscription ID is required"
        );
      }

      const orgSubscription = await this.prisma.organizationSubscription.findUnique({
        where: {
          id: subscription_id
        }
      })


      if (orgSubscription === null || !orgSubscription.rzp_subscription_id) {
        throw new BadRequestException("No active subscription found for this organization");
      }

      const razorpay = await this.getRazorpayInstance();

      const invoices = await razorpay.invoices.all({
        subscription_id: orgSubscription?.rzp_subscription_id,
        // count: 100,
      });

      return invoices.items.map((invoice: any) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        amount: invoice.amount,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
        issued_at: invoice.issued_at
          ? new Date(invoice.issued_at * 1000)
          : null,
        paid_at: invoice.paid_at
          ? new Date(invoice.paid_at * 1000)
          : null,
        short_url: invoice.short_url,
        invoice_url: invoice.invoice_url,
      }));

    } catch (error: any) {
      if (
        error?.statusCode === 401 ||
        error?.error?.description === "Authentication failed"
      ) {
        throw new UnauthorizedException(
          "Invalid Razorpay API credentials."
        );
      }
      throw error;
    }
  }
}
