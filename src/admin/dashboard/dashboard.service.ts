import { Injectable } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService
  ) { }
  create(createDashboardDto: CommonDto) {
    return 'This action adds a new dashboard';
  }

  async findTotal() {
    try {
      const totalAgents = await this.prisma.user.count({
        where: {
          role_id: {
            in: [2]
          }
        }
      })

      const totalActiveAgents = await this.prisma.user.count({
        where: {
          role_id: {
            in: [2]
          },
          status: "ACTIVE"
        }
      })

      const totalCustomers = await this.prisma.customer.count({})

      return {
        TotalAgents: totalAgents,
        TotalActiveAgents: totalActiveAgents,
        TotalCustomers: totalCustomers,

      }
    } catch (error) {
      throw error
    }
  }

  async planUsage() {
    try {
      const totalActiveSubscriptions =
        await this.prisma.organizationSubscription.count({
          where: {
            status: 'ACTIVE',
          },
        });

      if (totalActiveSubscriptions === 0) {
        return {
          totalActiveSubscriptions: 0,
          plans: [],
        };
      }

      const planUsage = await this.prisma.organizationSubscription.groupBy({
        by: ['plan_id'],
        where: {
          status: 'ACTIVE',
          OR: [
            {
              end_at: {
                gt: new Date(),
              },
            },
            {
              end_at: null,
            },
          ],
        },
        _count: {
          _all: true,
        },
      });


      const planIds = planUsage.map(p => p.plan_id);

      const plans = await this.prisma.subscriptionPlan.findMany({
        where: {
          id: { in: planIds },
        },
        select: {
          id: true,
          code: true,
          name: true,
          billing_cycle: true,
          price: true,
          is_active: true,
        },
      });

      const result = planUsage
        .map(usage => {
          const plan = plans.find(p => p.id === usage.plan_id);

          const count = usage._count._all;
          const percentage = Number(
            ((count / totalActiveSubscriptions) * 100).toFixed(2),
          );

          return {
            plan_id: usage.plan_id,
            plan_code: plan?.code,
            plan_name: plan?.name,
            billing_cycle: plan?.billing_cycle,
            price: plan?.price,
            active_subscriptions: count,
            percentage_share: percentage,
          };
        })
        .sort((a, b) => b.active_subscriptions - a.active_subscriptions);

      return {
        totalActiveSubscriptions,
        mostUsedPlan: result[0] ?? null,
        plans: result,
      };
    } catch (error) {
      throw error;
    }
  }

  findAll() {

  }

  findOne(id: number) {
    return `This action returns a #${id} dashboard`;
  }

  update(id: number, updateDashboardDto: CommonDto) {
    return `This action updates a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }
}
