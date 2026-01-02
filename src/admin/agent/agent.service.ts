import { Injectable } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData } from 'src/helper/common.helper';
import { R2Service } from 'src/helper/r2.helper';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
  ) { }
  create(createAgentDto: CommonDto) {
    return 'This action adds a new agent';
  }

  async findAll(getAgentDto: CommonDto) {
    try {
      const payload = decryptData(getAgentDto.data);

      const page = Number(payload.page) || 1;
      const limit = Number(payload.limit) || 10;
      const search = payload.search?.trim();
      const status = payload.status?.trim();

      const skip = (page - 1) * limit;

      const where: any = {
        role_id: 2,
      };
      if (status) {
        where.agentKYC = {
          kyc_status: status,
        };
      }
      if (search) {
        where.OR = [
          {
            first_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            last_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            phone_no: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }
      const [total, data] = await this.prisma.$transaction([
        this.prisma.user.count({ where }),
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_no: true,
            image: true,
            created_at: true,
            agentKYC: {
              select: {
                kyc_status: true,
              },
            },
          }
        }),
      ]);

      return {
        Agents: data,
        Total: total
      }
    } catch (error) {
      throw error;
    }
  }

  async findOne(agent_id: bigint) {
    try {
      const agent = await this.prisma.user.findUnique({
        where: {
          id: agent_id
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
          image: true,
          country: true,
          currency: true,
          created_at: true,
          agentKYC: {
            select: {
              kyc_status: true,
              pan_number: true,
              pan_image: true,
              aadhar_number: true,
              aadhar_image: true,
              account_number: true,
              bank_name: true,
              branch_name: true,
              ifsc_code: true,
              qr_code: true,
              upi_id: true,
              created_at: true,
            },
          },
          organizations: {
            select: {
              id: true,
              name: true,
              contact_email: true,
              contact_phone: true,
              gst_number: true,
              pan_number: true,
              status: true,
              createdByUser: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone_no: true,
                  image: true,
                }
              },
              created_at: true,
              subscription: {
                select: {
                  id: true,
                  start_at: true,
                  end_at: true,
                  auto_renew: true,
                  source: true,
                  status: true,
                  created_at: true,
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
                }
              }
            }
          },
          agentProductEntities: {
            select: {
              productEntity: {
                select: {
                  products: {
                    select: {
                      id: true,
                      name: true,
                    }
                  },
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        }
      })
      if (!agent) return null;
      const [
        profileImage,
        panImage,
        aadharImage,
        qrCode,
      ] = await Promise.all([
        agent?.image
          ? R2Service.getSignedUrl(agent?.image)
          : null,
        agent?.agentKYC?.pan_image
          ? R2Service.getSignedUrl(agent?.agentKYC.pan_image)
          : null,
        agent?.agentKYC?.aadhar_image
          ? R2Service.getSignedUrl(agent?.agentKYC.aadhar_image)
          : null,
        agent?.agentKYC?.qr_code
          ? R2Service.getSignedUrl(agent?.agentKYC.qr_code)
          : null,
      ]);

      return {
        ...agent,
        image: profileImage,
        agentKYC: agent?.agentKYC
          ? {
            ...agent?.agentKYC,
            pan_image: panImage,
            aadhar_image: aadharImage,
            qr_code: qrCode,
          }
          : null,
      };
    } catch (error) {
      throw error;
    }
  }

  async update(agent_id: bigint, updateAgentDto: CommonDto) {
    try {
      const payload = decryptData(updateAgentDto.data);
      const update = await this.prisma.agentKYC.update({
        where: {
          agent_id
        },
        data: {
          agent: {
            update: {
              status: payload?.status,
            }
          },
          kyc_status: payload?.kyc_status,
        }
      })
      return true;
    } catch (error) {
      throw error;
    }
  }

  async remove(agent_id: bigint) {
    try {
      await this.prisma.user.delete({ where: { id: agent_id } });
      await this.prisma.agentKYC.delete({ where: { agent_id } });
      await this.prisma.agentProductEntity.deleteMany({ where: { agent_id } })
      await this.prisma.invalidatedToken.deleteMany({ where: { user_id: agent_id } })
      await this.prisma.organization.deleteMany({ where: { created_by: agent_id } })
      await this.prisma.organizationUser.deleteMany({ where: { user_id: agent_id } })

      return true;
    } catch (error) {
      throw error;
    }
  }
}
