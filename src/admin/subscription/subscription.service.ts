import { Injectable } from '@nestjs/common';
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
          max_agents: true,
          is_active: true,
          rzp_plan_id: true,
          currency: {
            select: {
              id: true,
              code: true,
              symbol: true
            }
          },
          subscriptionPlanFeatures: {
            select: {
              feature: {
                select: {
                  id: true,
                  name: true,
                  key: true,
                  description: true,
                }
              }
            }
          },
          created_at: true,
          updated_at: true
        }
      });
      return plans;
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} subscription`;
  }

  async updatePlan(plan_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { max_agents, is_active, code } = payload;

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
      throw error
    }
  }


  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
