import { Injectable } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService
  ) { }

  async agentsData() {
    try {
      /* ============================================================
         1. FETCH ALL AGENTS
         ============================================================ */
      const agents = await this.prisma.user.findMany({
        where: {
          role: {
            name: 'AGENT', // adjust if role resolution differs
          },
          is_deleted: false,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          status: true,
          onboardingStatus: true,
        },
      });

      /* ---------------- AGENT STATUS COUNTS ---------------- */
      const agentStatusWise: Record<string, number> = {};
      const onboardingWise: Record<string, number> = {};

      for (const agent of agents) {
        agentStatusWise[agent.status] =
          (agentStatusWise[agent.status] || 0) + 1;

        onboardingWise[agent.onboardingStatus] =
          (onboardingWise[agent.onboardingStatus] || 0) + 1;
      }

      /* ============================================================
         2. AGENT → ORGANIZATION MAP
         ============================================================ */
      const organizations = await this.prisma.organization.findMany({
        where: {
          createdByUser: {
            role: { name: 'AGENT' },
            is_deleted: false,
          },
        },
        select: {
          id: true,
          created_by: true, // agent_id
        },
      });

      const agentOrgMap = new Map<string, string>();
      for (const org of organizations) {
        agentOrgMap.set(org.created_by.toString(), org.id.toString());
      }

      /* ============================================================
         3. FETCH LATEST SUBSCRIPTION PER ORGANIZATION
         ============================================================ */
      const latestSubscriptions =
        await this.prisma.organizationSubscription.findMany({
          orderBy: { created_at: 'desc' },
          distinct: ['org_id'], // latest subscription per org
          select: {
            org_id: true,
            status: true,
          },
        });

      const orgSubscriptionMap = new Map<string, string>();
      for (const sub of latestSubscriptions) {
        orgSubscriptionMap.set(sub.org_id.toString(), sub.status);
      }

      /* ---------------- SUBSCRIBED vs NOT SUBSCRIBED ---------------- */
      const SUBSCRIBED_STATUSES = ['ACTIVE', 'UPGRADED'];

      let subscribedAgents = 0;
      let notSubscribedAgents = 0;

      for (const agent of agents) {
        const orgId = agentOrgMap.get(agent.id.toString());
        const subStatus = orgId
          ? orgSubscriptionMap.get(orgId)
          : null;

        if (subStatus && SUBSCRIBED_STATUSES.includes(subStatus)) {
          subscribedAgents++;
        } else {
          notSubscribedAgents++;
        }
      }

      /* ============================================================
         4. SALES METRICS
         ============================================================ */
      const sales = await this.prisma.agentSale.findMany({
        select: {
          agent_id: true,
          agent: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      const agentSaleMap = new Map<
        string,
        {
          agent_id: bigint;
          agent_name: string;
          saleCount: number;
        }
      >();

      for (const sale of sales) {
        const key = sale.agent_id.toString();

        if (!agentSaleMap.has(key)) {
          agentSaleMap.set(key, {
            agent_id: sale.agent_id,
            agent_name: `${sale.agent.first_name ?? ''} ${sale.agent.last_name ?? ''}`.trim(),
            saleCount: 0,
          });
        }

        agentSaleMap.get(key)!.saleCount++;
      }

      const agentWiseSales = Array.from(agentSaleMap.values()).sort(
        (a, b) => b.saleCount - a.saleCount
      );

      /* ============================================================
         5. FINAL RESPONSE
         ============================================================ */
      return {
        agents: {
          total: agents.length,
          statusWise: agentStatusWise,
          onboardingWise,
        },
        subscriptions: {
          subscribedAgents,
          notSubscribedAgents,
        },
        sales: {
          total: sales.length,
          agentWise: agentWiseSales,
        },
      };
    } catch (error) {
      throw error;
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
