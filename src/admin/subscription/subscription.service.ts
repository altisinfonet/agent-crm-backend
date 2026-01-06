import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData } from 'src/helper/common.helper';
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
    const RazorpaySetting = await this.settingsService.paymentSettings();

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
        yearly: SubscriptionCycle.YEARLY
      };

      const rzpPlans = await this.razorpay.plans.all({
        count: 100
      });

      const results: any = [];
      for (const rzpPlan of rzpPlans.items) {
        const price = Number(rzpPlan.item.amount);
        const currencyCode = rzpPlan.item.currency;

        const billingCycle = cycleMap[rzpPlan.period];
        if (!billingCycle) continue;

        const currency = await this.prisma.currency.findFirst({
          where: { code: currencyCode }
        });
        if (!currency) continue;
        const plan = await this.prisma.subscriptionPlan.upsert({
          where: { rzp_plan_id: rzpPlan.id },
          update: {
            name: rzpPlan.item.name,
            description: rzpPlan.item.description,
            price,
            billing_cycle: billingCycle
          },
          create: {
            rzp_plan_id: rzpPlan.id,
            name: rzpPlan.item.name,
            description: rzpPlan.item.description,
            price,
            currency_id: currency.id,
            billing_cycle: billingCycle,
            max_agents: 5,
            is_active: false,
            code: rzpPlan.item.name
          }
        });

        results.push(plan);
      }

      return results;

    } catch (error) {
      throw error
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
          billing_cycle: true,
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
          billing_cycle: true,
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

      const formattedPlan = {
        code: plan?.code,
        name: plan?.name,
        description: plan?.description,
        price: plan?.price,
        currency: plan?.currency,
        billing_cycle: plan?.billing_cycle,
        rzp_plan_id: plan?.rzp_plan_id,
        created_at: plan?.created_at,
        features: plan?.subscriptionPlanFeatures.map(spf => spf.feature)
      };

      return formattedPlan;
    } catch (error) {
      throw error;
    }
  }

  async updatePlan(plan_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { max_agents, is_active, code } = payload;

      const duplicatePlan = await this.prisma.subscriptionPlan.findFirst({
        where: {
          code,
          id: {
            not: plan_id
          }
        },
      });

      if (duplicatePlan) {
        throw new BadRequestException("Duplicate plan code.");
      }

      const update = await this.prisma.subscriptionPlan.update({
        where: { id: plan_id },
        data: {
          max_agents,
          is_active,
          code
        }
      });

      return update;
    } catch (error) {
      throw error;
    }
  }

  async adminUpgradeSubscription(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { orgId, planId, durationDays } = payload;

      if (!orgId || !planId) {
        throw new BadRequestException("organization Id and plan Id are required.");
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

        if (activeSub && activeSub.source === "ADMIN") {
          await tx.organizationSubscription.update({
            where: { id: activeSub.id },
            data: {
              plan_id: planId,
              start_at: new Date(),
              end_at: durationDays
                ? new Date(Date.now() + durationDays * 86400000)
                : null
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
            end_at: durationDays
              ? new Date(Date.now() + durationDays * 86400000)
              : null,
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
      const { orgId, planId, durationDays } = payload;
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
          end_at: durationDays
            ? new Date(Date.now() + durationDays * 86400000)
            : null,
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


  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
