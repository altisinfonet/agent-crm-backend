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

  findAll() {
    return `This action returns all dashboard`;
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
