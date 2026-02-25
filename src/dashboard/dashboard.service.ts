import { Injectable } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { CommonDto } from '@/auth/dto/common.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async customerData(
    agent_id: bigint,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      /* ============================================================
         DATE FILTER (OPTIONAL)
         ============================================================ */
      let dateFilter: any = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        dateFilter.created_at = {
          gte: start,
          lte: end,
        };
      }

      /* ============================================================
         1. FETCH ALL CUSTOMERS CREATED BY AGENT
         ============================================================ */
      const customers = await this.prisma.customer.findMany({
        where: {
          created_by: agent_id,
          ...dateFilter,
        },
        select: {
          id: true,
          status: true,
        },
      });

      /* ---------------- ALL CUSTOMER MAP ---------------- */
      const allCustomerMap = new Map<string, string>();
      for (const customer of customers) {
        allCustomerMap.set(customer.id.toString(), customer.status);
      }

      /* ---------------- STATUS-WISE COUNT ---------------- */
      const statusWise: Record<string, number> = {};
      for (const status of allCustomerMap.values()) {
        statusWise[status] = (statusWise[status] || 0) + 1;
      }

      /* ============================================================
         2. FETCH ALL SALES FOR AGENT (FOR ANALYTICS)
         ============================================================ */
      const sales = await this.prisma.agentSale.findMany({
        where: { agent_id },
        select: {
          customer_id: true,
          product_entity_id: true,
          productEntity: {
            select: {
              id: true,
              name: true,
              slug: true,
              products: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      /* ---------------- SOLD CUSTOMER SET ---------------- */
      const soldCustomerSet = new Set<string>();
      for (const sale of sales) {
        soldCustomerSet.add(sale.customer_id.toString());
      }

      /* ============================================================
         3. PRODUCT → ENTITY → CUSTOMER AGGREGATION
         ============================================================ */
      const productMap = new Map<
        string,
        {
          product_id: bigint;
          product_name: string;
          product_slug: string;
          entityMap: Map<
            string,
            {
              product_entity_id: bigint;
              entity_name: string;
              entity_slug: string;
              customers: Set<string>;
            }
          >;
          customers: Set<string>;
        }
      >();

      for (const sale of sales) {
        const customerId = sale.customer_id.toString();
        const entity = sale.productEntity;
        const product = entity.products;

        const productKey = product.id.toString();
        const entityKey = entity.id.toString();

        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            product_id: product.id,
            product_name: product.name,
            product_slug: product.slug,
            entityMap: new Map(),
            customers: new Set(),
          });
        }

        const productNode = productMap.get(productKey)!;
        productNode.customers.add(customerId);

        if (!productNode.entityMap.has(entityKey)) {
          productNode.entityMap.set(entityKey, {
            product_entity_id: entity.id,
            entity_name: entity.name,
            entity_slug: entity.slug,
            customers: new Set(),
          });
        }

        productNode.entityMap.get(entityKey)!.customers.add(customerId);
      }

      /* ============================================================
         4. FORMAT PRODUCT RESPONSE
         ============================================================ */
      const products = Array.from(productMap.values()).map((product) => ({
        product_id: product.product_id,
        product_name: product.product_name,
        product_slug: product.product_slug,
        totalCustomers: product.customers.size,
        entities: Array.from(product.entityMap.values()).map((entity) => ({
          product_entity_id: entity.product_entity_id,
          entity_name: entity.entity_name,
          entity_slug: entity.entity_slug,
          customerCount: entity.customers.size,
        })),
      }));

      /* ============================================================
         5. FINAL RESPONSE
         ============================================================ */
      const totalCustomers = allCustomerMap.size;
      let withSale = 0;

      for (const customerId of soldCustomerSet) {
        if (allCustomerMap.has(customerId)) {
          withSale++;
        }
      }
      const withoutSale = totalCustomers - withSale;

      return {
        customers: {
          total: totalCustomers,
          statusWise,
          withSale,
          withoutSale,
        },
        products,
      };
    } catch (error) {
      throw error;
    }
  }


  async agentMeetingDashboard(
    agent_id: bigint,
    page?: number,
    limit?: number,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const shouldPaginate =
        Number.isFinite(page) &&
        Number.isFinite(limit) &&
        (page as number) > 0 &&
        (limit as number) > 0;

      const skip = shouldPaginate ? ((page as number) - 1) * (limit as number) : undefined;
      const take = shouldPaginate ? (limit as number) : undefined;

      /* ============================================================
         DATE FILTER (OPTIONAL)
         ============================================================ */
      let dateFilter: any = {};

      if (startDate || endDate) {
        dateFilter.start_time = {};

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          dateFilter.start_time.gte = start;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.start_time.lte = end;
        }
      }

      /* ============================================================
         STANDARD DATE RANGES (FOR METRICS)
         ============================================================ */
      const now = new Date();

      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      /* ============================================================
         FETCH MEETINGS FOR METRICS (DATE-AWARE)
         ============================================================ */
      const allMeetings = await this.prisma.meeting.findMany({
        where: {
          agent_id,
          ...dateFilter,
        },
        select: {
          status: true,
          meeting_type: true,
          start_time: true,
        },
      });

      const statusWise: Record<string, number> = {};
      const typeWise: Record<string, number> = {};

      let upcoming = 0;
      let today = 0;
      let thisWeek = 0;
      let thisMonth = 0;
      let thisYear = 0;

      for (const meeting of allMeetings) {
        // Status-wise
        statusWise[meeting.status] =
          (statusWise[meeting.status] || 0) + 1;

        // Type-wise
        typeWise[meeting.meeting_type] =
          (typeWise[meeting.meeting_type] || 0) + 1;

        const start = meeting.start_time;

        // Upcoming (relative to now, still valid with date filter)
        if (meeting.status === 'SCHEDULED' && start > now) {
          upcoming++;
        }

        if (start >= startOfDay && start <= endOfDay) {
          today++;
        }

        if (start >= startOfWeek && start <= endOfWeek) {
          thisWeek++;
        }

        if (start >= startOfMonth && start <= endOfMonth) {
          thisMonth++;
        }

        if (start >= startOfYear && start <= endOfYear) {
          thisYear++;
        }
      }

      /* ============================================================
         FETCH MEETING LIST (DATE-AWARE + PAGINATED)
         ============================================================ */
      const meetings = await this.prisma.meeting.findMany({
        where: {
          agent_id,
          ...dateFilter,
        },
        ...(shouldPaginate ? { skip, take } : {}),
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          meeting_type: true,
          start_time: true,
          end_time: true,
          status: true,
          is_completed: true,
          created_at: true,
        },
      });

      /* ============================================================
         FINAL RESPONSE
         ============================================================ */
      return {
        metrics: {
          statusWise,
          typeWise,
          upcoming,
          today,
          thisWeek,
          thisMonth,
          thisYear,
        },
        meetings,
      };
    } catch (error) {
      throw error;
    }
  }


  async agentTodoDashboard(
    agent_id: bigint,
    page?: number,
    limit?: number,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const shouldPaginate =
        Number.isFinite(page) &&
        Number.isFinite(limit) &&
        (page as number) > 0 &&
        (limit as number) > 0;

      const skip = shouldPaginate ? ((page as number) - 1) * (limit as number) : undefined;
      const take = shouldPaginate ? (limit as number) : undefined;

      /* ============================================================
         DATE FILTER (OPTIONAL)
         ============================================================ */
      let dateFilter: any = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        dateFilter.due_date = {
          gte: start,
          lte: end,
        };
      }

      /* ============================================================
         DATE RANGES
         ============================================================ */
      const now = new Date();

      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      /* ============================================================
         FETCH ALL TODOS (FOR METRICS)
         ============================================================ */
      const allTodos = await this.prisma.toDo.findMany({
        where: { agent_id, ...dateFilter },
        select: {
          priority: true,
          is_completed: true,
          due_date: true,
        },
      });

      /* ============================================================
         METRICS CALCULATION
         ============================================================ */
      const priorityWise: Record<string, number> = {};
      let completed = 0;
      let pending = 0;
      let overdue = 0;
      let dueToday = 0;
      let dueThisWeek = 0;
      let dueThisMonth = 0;

      for (const todo of allTodos) {
        // Priority-wise
        priorityWise[todo.priority] =
          (priorityWise[todo.priority] || 0) + 1;

        // Completion
        if (todo.is_completed) {
          completed++;
        } else {
          pending++;
        }

        // Due date based metrics
        if (todo.due_date && !todo.is_completed) {
          const due = todo.due_date;

          if (due < now) {
            overdue++;
          }

          if (due >= startOfDay && due <= endOfDay) {
            dueToday++;
          }

          if (due >= startOfWeek && due <= endOfWeek) {
            dueThisWeek++;
          }

          if (due >= startOfMonth && due <= endOfMonth) {
            dueThisMonth++;
          }
        }
      }

      /* ============================================================
         FETCH TODO LIST (PAGINATED)
         ============================================================ */
      const todos = await this.prisma.toDo.findMany({
        where: { agent_id, ...dateFilter },
        ...(shouldPaginate ? { skip, take } : {}),
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          due_date: true,
          priority: true,
          is_completed: true,
          created_at: true,
        },
      });

      /* ============================================================
         FINAL RESPONSE
         ============================================================ */
      return {
        metrics: {
          priorityWise,
          completed,
          pending,
          overdue,
          dueToday,
          dueThisWeek,
          dueThisMonth,
        },
        todos,
      };
    } catch (error) {
      throw error;
    }
  }


}
