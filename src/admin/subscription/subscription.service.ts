import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData } from '@/common/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import Razorpay = require("razorpay");
import { SettingsService } from 'src/settings/settings.service';
import { SubscriptionCycle } from 'generated/prisma';

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
    const RazorpaySetting = await this.settingsService.paymentSettings("payment-settings");

    this.razorpay = new Razorpay({
      key_id: RazorpaySetting.RAZORPAY_KEY_ID,
      key_secret: RazorpaySetting.RAZORPAY_KEY_SECRET
    });
  }

  async syncPlan() {
    try {
      const cycleMap: Record<string, SubscriptionCycle> = {
        weekly: SubscriptionCycle.WEEKLY,
        monthly: SubscriptionCycle.MONTHLY,
        quarterly: SubscriptionCycle.QUARTERLY,
        yearly: SubscriptionCycle.YEARLY,
      };

      const rzpPlans = await this.razorpay.plans.all({ count: 100 });
      const results: any[] = [];

      for (const rzpPlan of rzpPlans.items) {
        const existingPlan = await this.prisma.subscriptionPlan.findUnique({
          where: { rzp_plan_id: rzpPlan.id },
          select: { id: true },
        });

        if (existingPlan) {
          continue;
        }
        const billingCycle = cycleMap[rzpPlan.period];
        if (!billingCycle) continue;

        const price = Number(rzpPlan.item.amount);
        const currencyCode = rzpPlan.item.currency;

        const currency = await this.prisma.currency.findFirst({
          where: { code: currencyCode },
        });
        if (!currency) continue;

        const baseCode = rzpPlan.item.name.trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')

        const finalCode = await this.generateUniquePlanCode(baseCode);

        const plan = await this.prisma.subscriptionPlan.create({
          data: {
            rzp_plan_id: rzpPlan.id,
            name: rzpPlan.item.name,
            description: rzpPlan.item.description,
            price,
            currency_id: currency.id,
            billing_cycle: billingCycle,
            max_customers: 5,
            is_active: false,
            code: finalCode,
          },
        });

        results.push(plan);
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  async findAllPlans() {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        orderBy: {
          created_at: "desc"
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          price: true,
          is_popular: true,
          billing_cycle: true,
          max_customers: true,
          is_active: true,
          rzp_plan_id: true,
          created_at: true,
          currency: {
            select: {
              id: true,
              name: true,
              code: true,
              symbol: true
            }
          },
        }
      });

      return plans;
    } catch (error) {
      throw error;
    }
  }

  async findOne(plan_id: bigint) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: {
          id: plan_id,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          price: true,
          is_popular: true,
          billing_cycle: true,
          is_active: true,
          rzp_plan_id: true,
          max_customers: true,
          created_at: true,
          currency: {
            select: {
              id: true,
              name: true,
              code: true,
              symbol: true
            }
          },
          subscriptionFeatures: {
            select: {
              features: true,
              created_at: true
            }
          }
        }
      });

      const formattedPlan = {
        code: plan?.code,
        name: plan?.name,
        description: plan?.description,
        price: plan?.price,
        is_popular: plan?.is_popular,
        currency: plan?.currency,
        billing_cycle: plan?.billing_cycle,
        is_active: plan?.is_active,
        max_customers: plan?.max_customers,
        rzp_plan_id: plan?.rzp_plan_id,
        created_at: plan?.created_at,
        features: plan?.subscriptionFeatures.map(spf => spf.features)
      };

      return formattedPlan;
    } catch (error) {
      throw error;
    }
  }

  async updatePlan(plan_id: bigint, dto: CommonDto) {
    const payload = decryptData(dto.data);
    const {
      name,
      description,
      max_customers,
      is_active,
      is_popular,
      code,
      features,
    } = payload;

    return this.prisma.$transaction(async (tx) => {
      if (code) {
        const duplicatePlan = await tx.subscriptionPlan.findFirst({
          where: {
            code,
            id: { not: plan_id },
          },
          select: { id: true },
        });

        if (duplicatePlan) {
          throw new BadRequestException('Duplicate plan code.');
        }
      }

      const updatedPlan = await tx.subscriptionPlan.update({
        where: { id: plan_id },
        data: {
          name,
          description,
          max_customers,
          is_active,
          is_popular,
          code,
        },
      });

      if (Array.isArray(features)) {
        await tx.subscriptionFeature.upsert({
          where: { plan_id },
          update: {
            features,
          },
          create: {
            plan_id,
            features,
          },
        });
      }

      return updatedPlan;
    });
  }

  async adminUpgradeSubscription(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      console.log("payload", payload);

      const { orgId, planId, endDate } = payload;

      if (!orgId || !planId) {
        throw new BadRequestException("organization Id and plan Id are required.");
      }

      if (!endDate) {
        throw new BadRequestException("Subscription end date is required.");
      }

      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        throw new BadRequestException("Invalid plan");
      }

      await this.prisma.$transaction(async (tx) => {
        const activeSub = await tx.organizationSubscription.findFirst({
          where: {
            org_id: orgId,
            status: "ACTIVE"
          }
        });
        console.log("activeSub", activeSub);

        if (activeSub && activeSub.source === "ADMIN") {
          await tx.organizationSubscription.update({
            where: { id: activeSub.id },
            data: {
              plan_id: planId,
              start_at: new Date(),
              end_at: endDate
            }
          });
          return;
        }

        if (activeSub && activeSub.source === "RAZORPAY") {
          await tx.organizationSubscription.update({
            where: { id: activeSub.id },
            data: {
              status: "UPGRADED"
            }
          });
        }

        await tx.organizationSubscription.create({
          data: {
            org_id: orgId,
            plan_id: planId,
            status: "ACTIVE",
            source: "ADMIN",
            start_at: new Date(),
            end_at: endDate,
            auto_renew: false
          }
        });
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  async adminAssignSubscriptionToAgent(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { orgId, planId, endDate } = payload;
      if (!orgId || !planId) {
        throw new BadRequestException("organization Id and plan Id are required.");
      }

      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        throw new BadRequestException("Invalid plan");
      }

      await this.prisma.organizationSubscription.updateMany({
        where: {
          org_id: orgId,
          status: "ACTIVE",
        },
        data: {
          status: "EXPIRED",
          auto_renew: false,
          end_at: new Date(),
        },
      });

      await this.prisma.organizationSubscription.create({
        data: {
          org_id: orgId,
          plan_id: plan.id,
          status: "ACTIVE",
          source: "ADMIN",
          start_at: new Date(),
          end_at: endDate,
          auto_renew: false,
        },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }


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
        } else {
          await this.razorpay.subscriptions.cancel(
            orgSubscription.rzp_subscription_id,
            true
          );
        }
      } catch (error: any) {
        console.error(
          "[RAZORPAY_TERMINATION_FAILED]",
          error?.error || error
        );
      }

      await this.prisma.organizationSubscription.update({
        where: { id: orgSubscription.id },
        data: {
          auto_renew: false,
        },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  async subscribers(subscribersDto: CommonDto) {
    try {
      const payload = decryptData(subscribersDto.data);

      const page = payload?.page ? Number(payload.page) : 1;
      const limit = payload?.limit ? Number(payload.limit) : 10;
      const search = payload?.search?.trim();
      const status = payload?.status;
      const plan_id = payload?.plan_id;
      const auto_renew = payload?.auto_renew;
      const source = payload?.source;

      const sortBy = payload?.sortBy || "created_at";
      const sortOrder = payload?.sortOrder === "asc" ? "asc" : "desc";

      const skip = (page - 1) * limit;
      const where: any = {
        ...(status && { status }),
        ...(plan_id && { plan_id }),
        ...(auto_renew !== undefined && { auto_renew }),
        ...(source && { source }),

        ...(search && {
          OR: [
            {
              organization: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              plan: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              plan: {
                code: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        }),
      };

      let orderBy: any = { created_at: sortOrder };

      if (sortBy === "start_at") {
        orderBy = { start_at: sortOrder };
      }

      if (sortBy === "end_at") {
        orderBy = { end_at: sortOrder };
      }

      if (sortBy === "plan_price") {
        orderBy = {
          plan: {
            price: sortOrder,
          },
        };
      }

      if (sortBy === "organization_name") {
        orderBy = {
          organization: {
            name: sortOrder,
          },
        };
      }

      const [data, total] = await this.prisma.$transaction([
        this.prisma.organizationSubscription.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            start_at: true,
            end_at: true,
            auto_renew: true,
            source: true,
            status: true,
            created_at: true,

            organization: {
              select: {
                id: true,
                name: true,
                contact_email: true,
                createdByUser: {
                  select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_no: true,
                    status: true,
                  },
                },
              },
            },

            plan: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
                price: true,
                is_active: true,
                rzp_plan_id: true,
                currency: {
                  select: {
                    name: true,
                    code: true,
                    symbol: true,
                  },
                },
              },
            },
          },
        }),

        this.prisma.organizationSubscription.count({ where }),
      ]);

      return {
        Subscribers: data,
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }

  private async generateUniquePlanCode(baseCode: string) {
    let code = baseCode;
    let counter = 1;

    while (true) {
      const exists = await this.prisma.subscriptionPlan.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!exists) {
        return code;
      }

      code = `${baseCode}-${counter}`;
      counter++;
    }
  }


  async removePlan(plan_id: bigint) {
    try {
      return this.prisma.$transaction(async (tx) => {
        const subscriptionCount = await tx.organizationSubscription.count({
          where: {
            plan_id,
          },
        });

        if (subscriptionCount > 0) {
          throw new BadRequestException(
            'Cannot delete plan. One or more Agents have subscribed to this plan.',
          );
        }

        const planCount = await tx.subscriptionPlan.count({
          where: { id: plan_id },
        });

        if (planCount === 0) {
          throw new NotFoundException(
            'Subscription plan not found.',
          );
        }

        await tx.subscriptionFeature.deleteMany({
          where: { plan_id },
        });

        await tx.subscriptionPlan.delete({
          where: { id: plan_id },
        });
        return true;
      });
    } catch (error) {
      throw error;
    }
  }

}
