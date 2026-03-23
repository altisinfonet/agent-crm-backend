import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import * as bcrypt from 'bcrypt';
import { decryptData, hashPassword } from '@/common/helper/common.helper';
import { R2Service } from '@/common/helper/r2.helper';
import { clearCurrentUserCache } from '@/common/helper/current-user-cache.helper';
import { SubscriptionStatus } from '@generated/prisma';
import {
  assertUsernameAvailable,
  generateUniqueUsername,
  isValidUsername,
  normalizeUsername,
} from '@/common/helper/username.helper';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async getCountryLists(page = 1, limit = 10, search?: string) {
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
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrencyLists(page = 1, limit = 10, search?: string) {
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
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }

  //   async getCurrentUser(userId: bigint) {
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
  //       throw new NotFoundException('User not found');
  //     }

  //     let agentExtras = {};

  //     if (user.role?.name === 'AGENT') {
  //       const agentData = await this.prisma.user.findUnique({
  //         where: {
  //           id: userId
  //         },
  //         select: {
  //           organizations: {
  //             select: {
  //               subscription: {
  //                 orderBy: {
  //                   created_at: "desc"
  //                 },
  //                 where: {
  //                   status: {
  //                     in: [
  //                       'ACTIVE',
  //                       'UPGRADED',
  //                       'PAUSED',
  //                       'CANCELLED',
  //                       "TRIAL",
  //                       'PENDING',
  //                       'EXPIRED',
  //                       'INCOMPLETE',
  //                     ],
  //                   },
  //                 },
  //                 select: {
  //                   status: true,
  //                   end_at: true,
  //                   source: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       });

  //       const subs = agentData?.organizations?.[0]?.subscription ?? [];
  //       const now = new Date();

  //       let subscriptionStatus: SubscriptionStatus | null = null;
  //       let isSubscribed = false;

  //       const isValidByDate = (endAt?: Date | null) => !endAt || endAt > now;

  //       const active = subs.find(s => s.status === 'ACTIVE' && isValidByDate(s.end_at));
  //       if (active) {
  //         subscriptionStatus = 'ACTIVE';
  //         isSubscribed = true;
  //       }

  //       if (!subscriptionStatus) {
  //         const adminUpgraded = subs.find(s => s.status === 'UPGRADED' && s.source === 'ADMIN');
  //         if (adminUpgraded) {
  //           subscriptionStatus = 'UPGRADED';
  //           isSubscribed = true;
  //         }
  //       }

  //       if (!subscriptionStatus) {
  //         const paused = subs.find(s => s.status === 'PAUSED' && isValidByDate(s.end_at));
  //         if (paused) {
  //           subscriptionStatus = 'PAUSED';
  //           isSubscribed = true;
  //         }
  //       }

  //       // Keep CANCELLED ahead of TRIAL so older trial rows do not override cancellation.
  //       if (!subscriptionStatus) {
  //         const cancelled = subs.find(s => s.status === 'CANCELLED');
  //         if (cancelled) {
  //           subscriptionStatus = cancelled.end_at && cancelled.end_at <= now ? 'EXPIRED' : 'CANCELLED';
  //           isSubscribed = false;
  //         }
  //       }

  //       if (!subscriptionStatus) {
  //         const inTrial = subs.find(
  //           s => s.status === 'TRIAL' && s.source === 'FREE' && isValidByDate(s.end_at)
  //         );
  //         if (inTrial) {
  //           subscriptionStatus = 'TRIAL';
  //           isSubscribed = true;
  //         }
  //       }

  //       if (!subscriptionStatus) {
  //         const expired = subs.find(
  //           s =>
  //             (s.status === 'ACTIVE' ||
  //               s.status === 'PAUSED' ||
  //               s.status === 'EXPIRED' ||
  //               s.status === 'UPGRADED') &&
  //             s.end_at &&
  //             s.end_at <= now
  //         );
  //         if (expired) {
  //           subscriptionStatus = 'EXPIRED';
  //           isSubscribed = false;
  //         }
  //       }

  //       if (!subscriptionStatus) {
  //         const pending = subs.find(s => s.status === 'PENDING');
  //         if (pending) {
  //           subscriptionStatus = 'PENDING';
  //           isSubscribed = false;
  //         }
  //       }

  //       if (!subscriptionStatus) {
  //         const incomplete = subs.find(s => s.status === 'INCOMPLETE');
  //         if (incomplete) {
  //           subscriptionStatus = 'INCOMPLETE';
  //           isSubscribed = false;
  //         }
  //       }

  //       agentExtras = {
  //         subscriptionStatus,
  //         isSubscribed,
  //       };
  //     }

  //     let image = user.image;
  //     if (image) {
  //       image = await R2Service.getSignedUrl(image);
  //     }

  //     return {
  //       ...user,
  //       ...agentExtras,
  //       image,
  //     };
  //   } catch (error) {
  //     throw error;
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
          user_name: true,
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
          where: {
            id: userId,
          },
          select: {
            organizations: {
              select: {
                subscription: {
                  take: 1,
                  orderBy: {
                    created_at: 'desc',
                  },
                  select: {
                    status: true,
                    end_at: true,
                  },
                },
              },
            },
          },
        });

        const latestSubscription =
          agentData?.organizations?.[0]?.subscription?.[0] ?? null;
        const now = new Date();
        const expirableStatuses: SubscriptionStatus[] = [
          'ACTIVE',
          'PAUSED',
          'TRIAL',
          'UPGRADED',
          'CANCELLED',
        ];
        const subscribedStatuses: SubscriptionStatus[] = [
          'ACTIVE',
          'PAUSED',
          'TRIAL',
          'UPGRADED',
        ];

        let subscriptionStatus: SubscriptionStatus | null =
          latestSubscription?.status ?? null;

        if (
          latestSubscription?.end_at &&
          latestSubscription.end_at <= now &&
          subscriptionStatus &&
          expirableStatuses.includes(subscriptionStatus)
        ) {
          subscriptionStatus = 'EXPIRED';
        }

        const isSubscribed =
          subscriptionStatus !== null &&
          subscribedStatuses.includes(subscriptionStatus);

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

  async getAgentPublicProfileByUserName(userName: string) {
    try {
      const normalizedUserName = this.normalizeUsernameOrThrow(userName);

      const agent = await this.prisma.user.findFirst({
        where: {
          user_name: normalizedUserName,
          is_deleted: false,
          status: 'ACTIVE',
          role: {
            name: 'AGENT',
          },
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          user_name: true,
          email: true,
          phone_no: true,
          image: true,
          agentProfile: {
            select: {
              id: true,
              social_media: true,
              brand_name: true,
              brand_logo: true,
              promotional_heading: true,
              promotional_subheading: true,
              promotional_banner: true,
              created_at: true,
            },
          },
          agentProductEntities: {
            orderBy: {
              created_at: 'asc',
            },
            select: {
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
          },
        },
      });

      if (!agent) {
        throw new NotFoundException('Agent profile not found');
      }

      const [profileImage, brandLogo, promotionalBanner] = await Promise.all([
        agent.image ? R2Service.getSignedUrl(agent.image) : null,
        agent.agentProfile?.brand_logo
          ? R2Service.getSignedUrl(agent.agentProfile.brand_logo)
          : null,
        agent.agentProfile?.promotional_banner
          ? R2Service.getSignedUrl(agent.agentProfile.promotional_banner)
          : null,
      ]);

      return {
        id: agent.id,
        first_name: agent.first_name,
        last_name: agent.last_name,
        user_name: agent.user_name,
        image: profileImage,
        agentProfile: agent.agentProfile
          ? {
            ...agent.agentProfile,
            brand_logo: brandLogo,
            promotional_banner: promotionalBanner,
          }
          : null,
        selectedProducts: this.groupAgentProductEntities(
          agent.agentProductEntities,
        ),
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
          },
        },
        agentKYC: {
          select: {
            pan_number: true,
          },
        },
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
        user_name,
        dob,
        old_password,
        new_password,
        onboardingStatus,
        country_id,
        currency_id,
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

      if (user_name !== undefined) {
        updateData.user_name = await this.validateAndPrepareUsername(
          user_name,
          userId,
        );
      } else if (!findUser.user_name) {
        const nextFirstName = first_name ?? findUser.first_name;
        const nextLastName = last_name ?? findUser.last_name;

        if (nextFirstName || nextLastName) {
          updateData.user_name = await generateUniqueUsername(
            this.prisma,
            nextFirstName,
            nextLastName,
            userId,
          );
        }
      }

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

      await clearCurrentUserCache(userId);
      return this.getCurrentUser(userId);
    } catch (error) {
      throw error;
    }
  }

  async updateProfileImage(
    userId: bigint,
    isDelete: boolean,
    file: { key?: string },
  ) {
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

      await clearCurrentUserCache(userId);

      const { password, ...user } = res;
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getAgentProfileUploadContext(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
        agentKYC: {
          select: {
            base_img_path: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role?.name !== 'AGENT') {
      throw new BadRequestException('Only agents can update agent profile');
    }

    if (!user.agentKYC?.base_img_path) {
      throw new BadRequestException(
        'KYC base image path not found. Complete KYC first.',
      );
    }

    return {
      base_img_path: user.agentKYC.base_img_path,
    };
  }

  async updateAgentProfile(
    userId: bigint,
    profileData: any,
    files: {
      brand_logo?: string;
      promotional_banner?: string;
    },
  ) {
    try {
      await this.getAgentProfileUploadContext(userId);

      const existingProfile = await this.prisma.agentProfile.findUnique({
        where: {
          agent_id: userId,
        },
      });

      const normalizedSocialMedia = this.normalizeAgentSocialMedia(
        profileData?.social_media,
      );

      const mergedProfile = {
        brand_name:
          profileData?.brand_name !== undefined
            ? profileData.brand_name
            : existingProfile?.brand_name,
        promotional_heading:
          profileData?.promotional_heading !== undefined
            ? profileData.promotional_heading
            : existingProfile?.promotional_heading,
        promotional_subheading:
          profileData?.promotional_subheading !== undefined
            ? profileData.promotional_subheading
            : existingProfile?.promotional_subheading,
        social_media:
          profileData?.social_media !== undefined
            ? normalizedSocialMedia
            : existingProfile?.social_media,
        brand_logo: files?.brand_logo ?? existingProfile?.brand_logo,
        promotional_banner:
          files?.promotional_banner ?? existingProfile?.promotional_banner,
      };

      const missingFields = [
        ['brand_name', mergedProfile.brand_name],
        ['brand_logo', mergedProfile.brand_logo],
        ['promotional_heading', mergedProfile.promotional_heading],
        ['promotional_subheading', mergedProfile.promotional_subheading],
        ['promotional_banner', mergedProfile.promotional_banner],
      ]
        .filter(([, value]) => this.isMissingAgentProfileValue(value))
        .map(([field]) => field);

      if (missingFields.length) {
        throw new BadRequestException(
          `Missing required agent profile fields: ${missingFields.join(', ')}`,
        );
      }

      const createProfileData = {
        agent_id: userId,
        brand_name: mergedProfile.brand_name,
        brand_logo: mergedProfile.brand_logo as string,
        promotional_heading: mergedProfile.promotional_heading,
        promotional_subheading: mergedProfile.promotional_subheading,
        promotional_banner: mergedProfile.promotional_banner as string,
        social_media: mergedProfile.social_media,
      };

      const profile = await this.prisma.agentProfile.upsert({
        where: {
          agent_id: userId,
        },
        update: mergedProfile,
        create: createProfileData,
      });

      await clearCurrentUserCache(userId);
      return this.formatAgentProfileResponse(profile);
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
      };
      const organizationId = kycData?.organizationId
        ? BigInt(kycData.organizationId)
        : null;
      const entity_ids: bigint[] = kycData?.entity_ids || [];

      const kyc = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new UnauthorizedException('Unauthorized');
        }
        const kyc = await tx.agentKYC.upsert({
          where: { agent_id: userId },
          update: {
            ...data,
            pan_image: files?.pan_image,
            aadhar_front: files?.aadhar_front,
            aadhar_back: files?.aadhar_back,
            qr_code: files?.qr_code,
            base_img_path: path,
          },
          create: {
            agent_id: userId,
            ...data,
            pan_image: files?.pan_image,
            aadhar_front: files?.aadhar_front,
            aadhar_back: files?.aadhar_back,
            qr_code: files?.qr_code,
            base_img_path: path,
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
                is_owner: false,
              },
            });
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
              },
            });
            await tx.organizationUser.create({
              data: {
                org_id: org.id,
                user_id: userId,
                role_id: user?.role_id,
                is_owner: true,
              },
            });
          }
        }

        return kyc;
      });

      await clearCurrentUserCache(userId);
      return kyc;
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
          user_name: true,
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
      const [profileImage, panImage, aadhar_front, aadhar_back, qrCode] =
        await Promise.all([
          agent.image ? R2Service.getSignedUrl(agent.image) : null,
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
          status: 'ACTIVE',
        },
        orderBy: {
          rank: 'asc',
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
            },
          },
          FAQ: {
            where: {
              status: 'ACTIVE',
            },
            orderBy: {
              rank: 'asc',
            },
            select: {
              id: true,
              question: true,
              answer: true,
              rank: true,
              status: true,
            },
          },
        },
      });
      return allFaqs;
    } catch (error) {
      throw error;
    }
  }

  private async validateAndPrepareUsername(userName: string, userId: bigint) {
    const normalizedUserName = this.normalizeUsernameOrThrow(userName);
    const isAvailable = await assertUsernameAvailable(
      this.prisma,
      normalizedUserName,
      userId,
    );

    if (!isAvailable) {
      throw new BadRequestException('Username is already taken');
    }

    return normalizedUserName;
  }

  private normalizeUsernameOrThrow(userName: string) {
    if (typeof userName !== 'string') {
      throw new BadRequestException('Username must be a valid string');
    }

    const normalizedUserName = normalizeUsername(userName);

    if (!normalizedUserName || !isValidUsername(normalizedUserName)) {
      throw new BadRequestException(
        'Username can only contain letters, numbers, periods, and underscores, cannot start or end with a period, cannot contain consecutive periods, and must be at most 30 characters.',
      );
    }

    return normalizedUserName;
  }

  private groupAgentProductEntities(items: any[] = []) {
    return Object.values(
      items.reduce((acc: any, item: any) => {
        const product = item.productEntity.products;

        if (!acc[product.id]) {
          acc[product.id] = {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
            },
            entities: [],
          };
        }

        acc[product.id].entities.push({
          id: item.productEntity.id,
          name: item.productEntity.name,
          slug: item.productEntity.slug,
        });

        return acc;
      }, {}),
    );
  }

  private normalizeAgentSocialMedia(value: any) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    }

    return value;
  }

  private isMissingAgentProfileValue(value: any) {
    return value === undefined || value === null || value === '';
  }

  private async formatAgentProfileResponse(profile: any) {
    const [brandLogo, promotionalBanner] = await Promise.all([
      profile?.brand_logo ? R2Service.getSignedUrl(profile.brand_logo) : null,
      profile?.promotional_banner
        ? R2Service.getSignedUrl(profile.promotional_banner)
        : null,
    ]);

    return {
      ...profile,
      brand_logo: brandLogo,
      promotional_banner: promotionalBanner,
    };
  }
}
