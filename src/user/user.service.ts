import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import * as bcrypt from 'bcrypt';
import { decryptData, hashPassword } from '@/common/helper/common.helper';
import { R2Service } from '@/common/helper/r2.helper';
import { SubscriptionStatus } from '@generated/prisma';

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

  // async getCurrentUser(userId: bigint) {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { id: userId },
  //       select: {
  //         id: true,
  //         first_name: true,
  //         last_name: true,
  //         email: true,
  //         phone_no: true,
  //         image: true,
  //         auth_method: true,
  //         dob: true,
  //         country: true,
  //         currency: true,
  //         onboardingStatus: true,
  //         role: {
  //           select: {
  //             id: true,
  //             name: true,
  //           },
  //         },
  //         is_deleted: true,
  //         is_temporary: true,
  //         created_at: true,
  //       },
  //     });

  //     if (!user) {
  //       throw new NotFoundException("User not found");
  //     }

  //     const agentOrg = await this.prisma.organizationUser.findFirst({
  //       where: {
  //         user_id: userId,
  //       },
  //     })

  //     const subscriptionCount = agentOrg
  //       ? await this.prisma.organizationSubscription.count({
  //         where: {
  //           org_id: agentOrg.org_id,
  //           status: {
  //             in: ['ACTIVE', 'UPGRADED'],
  //           },
  //         },
  //       })
  //       : 0;

  //     const isSubscribed = subscriptionCount > 0;

  //     const isAgent = user.role?.name === 'AGENT';
  //     let agentExtras = {};
  //     if (isAgent) {
  //       const agentData = await this.prisma.user.findUnique({
  //         where: { id: userId },
  //         select: {
  //           country: true,
  //           currency: true,
  //         },
  //       });
  //       agentExtras = agentData ?? {};
  //     }

  //     let image = user.image;
  //     if (image) {
  //       image = await R2Service.getSignedUrl(image);
  //     }

  //     return {
  //       ...user,
  //       ...agentExtras,
  //       image,
  //       isSubscribed,
  //     };

  //   } catch (error) {
  //     throw error
  //   }
  // }

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
          dob: true,
          country: true,
          currency: true,
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
        throw new NotFoundException('User not found');
      }

      let agentExtras = {};

      if (user.role?.name === 'AGENT') {
        const agentData = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            organizations: {
              select: {
                subscription: {
                  where: {
                    status: {
                      in: [
                        'ACTIVE',
                        'PAUSED',
                        'CANCELLED',
                        "TRIAL",
                        'PENDING',
                        'EXPIRED',
                        'INCOMPLETE',
                      ],
                    },
                  },
                  select: {
                    status: true,
                    end_at: true,
                    source: true,
                  },
                },
              },
            },
          },
        });

        // const subscriptionStatus =
        //   agentData?.organizations?.[0]?.subscription?.[0]?.status ?? null;

        // const isSubscribed =
        //   (subscriptionStatus === 'ACTIVE' ||
        //     subscriptionStatus === 'UPGRADED') && agentData?.organizations?.[0]?.subscription?.[0].end_at ;

        // agentExtras = {
        //   subscriptionStatus,
        //   isSubscribed,
        // };

        const subs = agentData?.organizations?.[0]?.subscription ?? [];
        const now = new Date();

        let subscriptionStatus: SubscriptionStatus | null = null;
        let isSubscribed = false;

        /**
         * Helper: check validity by end date
         */
        const isValidByDate = (endAt?: Date | null) =>
          !endAt || endAt > now;

        /**
         * 1️⃣ ACTIVE
         */
        const active = subs.find(s => s.status === 'ACTIVE');
        if (active && isValidByDate(active.end_at)) {
          subscriptionStatus = 'ACTIVE';
          isSubscribed = true;
        }

        if (!isSubscribed) {
          const inTrial = subs.find(
            s => s.status === "TRIAL" && s.source === 'FREE'
          );
          if (inTrial) {
            subscriptionStatus = 'TRIAL';
            isSubscribed = true;
          }
        }

        /**
         * 2️⃣ PAUSED (trial access)
         */
        if (!isSubscribed) {
          const paused = subs.find(
            s => s.status === 'PAUSED' && isValidByDate(s.end_at)
          );
          if (paused) {
            subscriptionStatus = 'PAUSED';
            isSubscribed = true;
          }
        }

        /**
         * 3️⃣ CANCELLED but still valid till cycle end
         */
        if (!isSubscribed) {
          const cancelled = subs.find(
            s => s.status === 'CANCELLED' && isValidByDate(s.end_at)
          );
          if (cancelled) {
            subscriptionStatus = 'CANCELLED';
            isSubscribed = false;
          }
        }

        if (!isSubscribed) {
          const adminUpgraded = subs.find(
            s => s.status === 'UPGRADED' && s.source === 'ADMIN'
          );
          if (adminUpgraded) {
            subscriptionStatus = 'UPGRADED';
            isSubscribed = true;
          }
        }

        /**
         * 5️⃣ EXPIRED STATES (no access)
         */
        if (!subscriptionStatus) {
          const expired = subs.find(
            s =>
              (s.status === 'ACTIVE' ||
                s.status === 'PAUSED' ||
                s.status === 'EXPIRED' ||
                s.status === 'CANCELLED') &&
              s.end_at &&
              s.end_at <= now
          );
          if (expired) {
            subscriptionStatus = 'EXPIRED';
          }
        }

        /**
        * 6️⃣ Pending / Incomplete (fallback)
        */
        const pending = subs.find(s => s.status === 'PENDING');
        if (pending) {
          subscriptionStatus = 'PENDING';
          isSubscribed = false;
        }

        if (!subscriptionStatus) {
          const incomplete = subs.find(s => s.status === 'INCOMPLETE');
          if (incomplete) subscriptionStatus = 'INCOMPLETE';
        }

        agentExtras = {
          subscriptionStatus,
          isSubscribed,
        };
      }

      let image = user.image;
      if (image) {
        image = await R2Service.getSignedUrl(image);
      }

      return {
        ...user,
        ...agentExtras,
        image,
      };
    } catch (error) {
      throw error;
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
        onboardingStatus,
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
      if (onboardingStatus) updateData.onboardingStatus = onboardingStatus;
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


  async saveKyc(userId: bigint, kycData: any, files: any, path: string) {
    try {
      const data = {
        pan_number: kycData?.pan_number,
        aadhar_number: kycData?.aadhar_number,
        bank_name: kycData?.bank_name,
        account_number: kycData?.account_number,
        branch_name: kycData?.branch_name,
        ifsc_code: kycData?.ifsc_code,
        upi_id: kycData?.upi_id,
      }
      const organizationId = kycData?.organizationId ? BigInt(kycData.organizationId) : null;
      const entity_ids: bigint[] = kycData?.entity_ids || [];

      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new UnauthorizedException("Unauthorized");
        }
        const kyc = await tx.agentKYC.upsert({
          where: { agent_id: userId },
          update: {
            ...data,
            pan_image: files?.pan_image,
            aadhar_front: files?.aadhar_front,
            aadhar_back: files?.aadhar_back,
            qr_code: files?.qr_code,
            base_img_path: path
          },
          create: {
            agent_id: userId,
            ...data,
            pan_image: files?.pan_image,
            aadhar_front: files?.aadhar_front,
            aadhar_back: files?.aadhar_back,
            qr_code: files?.qr_code,
            base_img_path: path
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

        if (organizationId) {
          const organizationUser = await tx.organizationUser.findFirst({
            where: {
              user_id: userId,
              org_id: organizationId,
            },
          });
          if (!organizationUser) {
            await tx.organizationUser.create({
              data: {
                org_id: organizationId,
                user_id: userId,
                role_id: user?.role_id,
                is_owner: false
              }
            })
          }
        } else {
          const existingOrg = await tx.organization.findFirst({
            where: {
              created_by: userId,
            },
          });
          if (!existingOrg) {
            const org = await this.prisma.organization.create({
              data: {
                name: kycData?.username,
                created_by: userId,
                contact_email: user?.email,
                contact_phone: user?.phone_no,
                gst_number: kycData?.pan_number,
                pan_number: kycData?.aadhar_number,
              }
            })
            await tx.organizationUser.create({
              data: {
                org_id: org.id,
                user_id: userId,
                role_id: user?.role_id,
                is_owner: true
              }
            })
          }
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
              aadhar_front: true,
              aadhar_back: true,
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
        aadhar_front,
        aadhar_back,
        qrCode,
      ] = await Promise.all([
        agent.image
          ? R2Service.getSignedUrl(agent.image)
          : null,
        agent.agentKYC?.pan_image
          ? R2Service.getSignedUrl(agent.agentKYC.pan_image)
          : null,
        agent.agentKYC?.aadhar_front
          ? R2Service.getSignedUrl(agent.agentKYC.aadhar_front)
          : null,
        agent.agentKYC?.aadhar_back
          ? R2Service.getSignedUrl(agent.agentKYC.aadhar_back)
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
            aadhar_front: aadhar_front,
            aadhar_back: aadhar_back,
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
