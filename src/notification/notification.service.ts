import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { FirebaseAdminService } from '@/utils/firebase.utils';
import { decryptData } from '@/helper/common.helper';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private FirebaseAdmin: FirebaseAdminService,
  ) { }

  async AddFCMToken(user_id: bigint, dto: CommonDto) {
    try {
      const { tokens: deviceToken } = decryptData(dto?.data);
      let insertedTokens: string[] = [];
      if (deviceToken && deviceToken.length > 0) {
        for (let i = 0; i < deviceToken.length; i++) {
          let checkAvailableToken = await this.prisma.userFCMToken.count({
            where: {
              user_id: user_id,
              token: deviceToken[i]
            }
          });

          if (checkAvailableToken == 0) {
            let res = await this.prisma.userFCMToken.create({
              data: {
                user_id: user_id,
                token: deviceToken[i]
              }
            });

            if (res?.id) {
              insertedTokens.push(res?.token);
            }
          }
        }
        return { tokens: insertedTokens };
      } else {
        throw new BadRequestException("No token found.")
      }
    } catch (error) {
      throw error
    }
  }

  async sendNotification(sendNotificationDto: CommonDto) {
    try {
      const { deviceTokens, title, body, url } = decryptData(sendNotificationDto?.data);
      const message = {
        notification: {
          title,
          body,
        },
        data: { url: url || '' },
        tokens: deviceTokens,
      };

      const response = await this.FirebaseAdmin.messaging().sendEachForMulticast(message);
      const results = response.responses.map((res: any, index: any) => ({
        token: deviceTokens[index],
        success: res.success,
        error: res.error?.message,
      }));

      return results
    } catch (error) {
      throw error
    }
  }

  async pushNotificationList(dto: CommonDto) {
    try {
      const payload = decryptData(dto?.data)
      let conditions: any[] = [];
      let searchWord = '';
      if (payload?.search) {
        let str = (payload?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { body: { contains: searchWord, mode: "insensitive" } },
            { title: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }

      if (payload?.type) {
        conditions.push({
          type: payload?.type
        })
      }

      let notification: any;
      if (payload && payload.page && payload.limit) {
        notification = await this.prisma.pushNotification.findMany({
          skip: (payload?.page - 1) * payload?.limit,
          take: payload?.limit,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            title: true,
            body: true,
            type: true,
            url: true,
            images: true,
            created_at: true,
          }
        });
      } else {
        notification = await this.prisma.pushNotification.findMany({
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            title: true,
            body: true,
            type: true,
            url: true,
            images: true,
            created_at: true,
          }
        });
      }
      const transformedNotifications = (notification || []).map(n => ({
        ...n,
        image: n.images?.[0]?.src || null,
        images: undefined
      }));

      const totalCount = await this.prisma.pushNotification.count({
        where: {
          AND: conditions
        },
      });
      return { Total: totalCount, Notifications: transformedNotifications || [] };
    } catch (error) {
      throw error
    }
  }

  async findAll(agent_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto?.data)
      const page = payload?.page ? Number(payload.page) : null;
      const limit = payload?.limit ? Number(payload.limit) : null;
      const isPaginated = page && limit;
      const skip = isPaginated ? (page - 1) * limit : undefined;
      const take = isPaginated ? limit : undefined;

      const where: any = {
        user_id: agent_id,
        ...(payload.status && { status: payload.status }),
        ...(payload.search && {
          OR: [
            {
              title: {
                contains: payload.search,
                mode: 'insensitive',
              },
            },
            {
              desc: {
                contains: payload.search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      };

      const [notifications, total, unread] = await Promise.all([
        this.prisma.inAppNotifications.findMany({
          where,
          ...(isPaginated && { skip, take }),
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            type: true,
            title: true,
            desc: true,
            image: true,
            is_read: true,
            metadata: true,
            created_at: true
          }
        }),
        this.prisma.inAppNotifications.count({ where }),
        this.prisma.inAppNotifications.count({
          where: {
            is_read: false,
          }
        }),
      ]);;

      return {
        Notifications: notifications,
        Unread: unread,
        Total: total
      };
    } catch (error) {
      throw error
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`;
  }

  async readNotifications(agent_id: bigint) {
    try {
      const readNotifications = await this.prisma.inAppNotifications.updateMany({
        where: {
          user_id: agent_id
        },
        data: {
          is_read: true,
        }
      })
      return true;
    } catch (error) {
      throw error
    }
  }

  remove(id: number) {
    return `This action removes a #${id} notification`;
  }
}
