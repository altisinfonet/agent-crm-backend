import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData, hashPassword } from 'src/helper/common.helper';
import * as bcrypt from 'bcrypt';
import { R2Service } from 'src/helper/r2.helper';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
  ) { }
  create(createUserDto: CommonDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  async getCurrentUser(userId: bigint) {
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

    const isAgent = user.role?.name === "AGENT";
    if (isAgent) {
      const agentData = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          country: true,
          currency: true,
        },
      });

      Object.assign(user, agentData);
    }

    if (user.image) {
      user.image = await R2Service.getSignedUrl(user.image);
    }

    return user;
  }



  async getUserForUpload(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
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
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
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
      return this.getCurrentUser(userId);
    } catch (error) {
      console.log("error", error);
      throw error
    }
  }

  async updateProfileImage(userId: bigint, dto: any, file: { key?: string }) {
    try {
      let dataToUpdate: any = {};

      if (Boolean(dto?.delete)) {
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

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
