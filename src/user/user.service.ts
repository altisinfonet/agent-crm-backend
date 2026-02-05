import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import * as bcrypt from 'bcrypt';
import { decryptData, hashPassword } from '@/common/helper/common.helper';
import { R2Service } from '@/common/helper/r2.helper';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async getCountryLists(
    page = 1,
    limit = 10,
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        status: 'ACTIVE',
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { iso_code: { contains: search, mode: 'insensitive' } },
          { phone_code: { contains: search, mode: 'insensitive' } },
          { region: { contains: search, mode: 'insensitive' } },
          { timezone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [countries, total] = await this.prisma.$transaction([
        this.prisma.country.findMany({
          where,
          select: {
            id: true,
            name: true,
            region: true,
            image: true,
            iso_code: true,
            phone_code: true,
            phoneLength: true,
            timezone: true,
            utc_offset_min: true,
            created_at: true,
          },
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.country.count({ where }),
      ]);

      return {
        Countries: countries,
        Total: total
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrencyLists(
    page = 1,
    limit = 10,
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        status: 'ACTIVE',
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [currencies, total] = await this.prisma.$transaction([
        this.prisma.currency.findMany({
          where,
          select: {
            id: true,
            name: true,
            code: true,
            symbol: true,
            exchange_rate: true,
          },
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.currency.count({ where }),
      ]);

      return {
        Currencies: currencies,
        Total: total
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(userId: bigint) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
          image: true,
          auth_method: true,
          onboardingStatus: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          is_deleted: true,
          is_temporary: true,
          created_at: true,
        },
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      const agentOrg = await this.prisma.organizationUser.findFirst({
        where: {
          user_id: userId,
        },
      })

      const subscriptionCount = agentOrg
        ? await this.prisma.organizationSubscription.count({
          where: {
            org_id: agentOrg.org_id,
            status: {
              in: ['ACTIVE', 'UPGRADED'],
            },
          },
        })
        : 0;

      const isSubscribed = subscriptionCount > 0;

      const isAgent = user.role?.name === 'AGENT';
      let agentExtras = {};
      if (isAgent) {
        const agentData = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            country: true,
            currency: true,
          },
        });
        agentExtras = agentData ?? {};
      }

      let image = user.image;
      if (image) {
        image = await R2Service.getSignedUrl(image);
      }

      return {
        ...user,
        ...agentExtras,
        image,
        isSubscribed,
      };

    } catch (error) {
      throw error
    }
  }

  async getUserForUpload(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: {
          select: {
            id: true,
            name: true,
          }
        },
        agentKYC: {
          select: {
            pan_number: true,
          }
        },
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateUserProfile(userId: bigint, commonDto: CommonDto) {
    try {
      const payload = decryptData(commonDto.data);

      const {
        email,
        phone_no,
        first_name,
        last_name,
        dob,
        old_password,
        new_password,
        country_id,
        currency_id
      } = payload;

      const findUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!findUser) {
        throw new BadRequestException('User not found');
      }

      const updateData: any = {};

      if (email) updateData.email = email.toLowerCase();
      if (phone_no) updateData.phone_no = phone_no;
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (dob) updateData.dob = dob;
      if (country_id) updateData.country_id = country_id;
      if (currency_id) updateData.currency_id = currency_id;

      const hasOld = !!old_password;
      const hasNew = !!new_password;
      let passwordChanged = false;
      if (hasOld || hasNew) {
        if (!hasOld) {
          throw new BadRequestException('Old password is required');
        }

        if (!hasNew) {
          throw new BadRequestException('New password is required');
        }

        if (!findUser.password) {
          throw new BadRequestException('Password not set for this account');
        }

        const isMatch = await bcrypt.compare(old_password, findUser.password);

        if (!isMatch) {
          throw new BadRequestException('Old password is incorrect');
        }
        updateData.password = await hashPassword(new_password);
        passwordChanged = true;
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      if (passwordChanged) {
        await this.prisma.userSession.updateMany({
          where: {
            user_id: userId,
            revoked: false,
          },
          data: {
            revoked: true,
            last_used_at: new Date(),
          },
        });
      }
      return this.getCurrentUser(userId);
    } catch (error) {
      throw error
    }
  }

  async updateProfileImage(userId: bigint, isDelete: boolean, file: { key?: string }) {
    try {
      let dataToUpdate: any = {};

      if (isDelete) {
        dataToUpdate.image = null;
      } else if (file?.key) {
        dataToUpdate.image = file.key;
      }

      const res = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: dataToUpdate,
      });

      const { password, ...user } = res;
      return user;
    } catch (error) {
      throw error;
    }
  }


  async saveKyc(userId: bigint, kycData: any, files: any) {
    try {
      if (!files?.pan_image) {
        throw new BadRequestException("PAN card image is required.")
      }
      if (!files?.aadhar_image) {
        throw new BadRequestException("AADHAR card image is required.")
      }
      if (!files?.qr_code) {
        throw new BadRequestException("QR code is required.")
      }

      const data = {
        pan_number: kycData?.pan_number,
        aadhar_number: kycData?.aadhar_number,
        bank_name: kycData?.bank_name,
        account_number: kycData?.account_number,
        branch_name: kycData?.branch_name,
        ifsc_code: kycData?.ifsc_code,
        upi_id: kycData?.upi_id,
      }
      const entity_ids: bigint[] = kycData?.entity_ids || [];

      return await this.prisma.$transaction(async (tx) => {
        const kyc = await tx.agentKYC.upsert({
          where: { agent_id: userId },
          update: {
            ...data,
            ...files,
          },
          create: {
            agent_id: userId,
            ...data,
            ...files,
          },
        });

        if (entity_ids.length) {
          await tx.agentProductEntity.createMany({
            data: entity_ids.map((entityId) => ({
              agent_id: userId,
              product_entity_id: BigInt(entityId),
            })),
            skipDuplicates: true,
          });
        }

        if (kycData?.onboardingStatus) {
          await tx.user.update({
            where: { id: userId },
            data: {
              onboardingStatus: kycData.onboardingStatus,
            },
          });
        }

        return kyc;
      });
    } catch (error) {
      throw error;
    }
  }

  async getAgentKYCDetails(userId: bigint) {
    try {
      const agent = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          first_name: true,
          last_name: true,
          email: true,
          phone_no: true,
          image: true,
          dob: true,
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
        },
      });

      if (!agent) return null;
      const [
        profileImage,
        panImage,
        aadharImage,
        qrCode,
      ] = await Promise.all([
        agent.image
          ? R2Service.getSignedUrl(agent.image)
          : null,
        agent.agentKYC?.pan_image
          ? R2Service.getSignedUrl(agent.agentKYC.pan_image)
          : null,
        agent.agentKYC?.aadhar_image
          ? R2Service.getSignedUrl(agent.agentKYC.aadhar_image)
          : null,
        agent.agentKYC?.qr_code
          ? R2Service.getSignedUrl(agent.agentKYC.qr_code)
          : null,
      ]);

      return {
        ...agent,
        image: profileImage,
        agentKYC: agent.agentKYC
          ? {
            ...agent.agentKYC,
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


  async clientFaq() {
    try {
      const allFaqs = await this.prisma.fAQModule.findMany({
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          rank: 'asc'
        },
        select: {
          id: true,
          name: true,
          desc: true,
          rank: true,
          status: true,
          _count: {
            select: {
              FAQ: true,
            }
          },
          FAQ: {
            where: {
              status: "ACTIVE",
            },
            orderBy: {
              rank: 'asc'
            },
            select: {
              id: true,
              question: true,
              answer: true,
              rank: true,
              status: true,
            }
          }
        }
      })
      return allFaqs;
    } catch (error) {
      throw error
    }
  }

}
