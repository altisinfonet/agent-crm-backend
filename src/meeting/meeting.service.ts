import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { createNotification, decryptData } from 'src/helper/common.helper';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MeetingService {
  constructor(
    private readonly prisma: PrismaService,
    private mailService: MailService
  ) { }

  async create(agent_id: bigint, createMeetingDto: CommonDto) {
    try {
      const payload = decryptData(createMeetingDto.data);
      const {
        title,
        desc,
        customer_id,
        start_time,
        end_time,
        meetingType,
        reminderBefore,
      } = payload;
      if (!title || !start_time) {
        throw new BadRequestException("Title and start time are required");
      }
      const startTime = new Date(start_time);
      const endTime = end_time ? new Date(end_time) : null;
      if (startTime < new Date()) {
        throw new BadRequestException("Meeting time must be in the future");
      }
      if (endTime && endTime <= startTime) {
        throw new BadRequestException("End time must be after start time");
      }
      const createdMeeting = await this.prisma.meeting.create({
        data: {
          agent: {
            connect: {
              id: agent_id,
            },
          },
          ...(customer_id && {
            customer: {
              connect: {
                id: BigInt(customer_id),
              },
            },
          }),

          title,
          description: desc,
          meeting_type: meetingType || "REMINDER",
          start_time: startTime,
          end_time: endTime,
          reminder_before: reminderBefore ?? null,
          status: "SCHEDULED",
          is_completed: false,
          reminder_sent: false,
        },
      });
      setImmediate(async () => {
        try {
          await this.mailService.sendMeetingEmail(createdMeeting, 'created');
          const notification: any = await this.getMeetingNotificationPayload(createdMeeting, 'created');

          await createNotification(
            agent_id,
            'MEETING',
            notification?.title,
            notification?.desc,
            {
              meeting_id: createdMeeting.id,
              status: createdMeeting.status,
              action: 'created',
            }
          );
        } catch (error) {
          console.error("Error sending metting email", error);
        }
      });
      return createdMeeting;
    } catch (error) {
      throw error
    }
  }

  private async getMeetingNotificationPayload(
    meeting: any,
    action: 'created' | 'updated'
  ) {
    if (action === 'created') {
      return {
        title: 'Meeting scheduled',
        desc: `Your meeting on “${meeting.title}” is scheduled and ready.`,
      };
    }

    switch (meeting.status) {
      case 'COMPLETED':
        return {
          title: 'Meeting completed',
          desc: `You’ve successfully completed your meeting on “${meeting.title}”.`,
        };

      case 'CANCELLED':
        return {
          title: 'Meeting cancelled',
          desc: `Your meeting on “${meeting.title}” has been cancelled.`,
        };

      case 'POSTPONED':
        return {
          title: 'Meeting rescheduled',
          desc: `Your meeting on “${meeting.title}” has been rescheduled.`,
        };

      default:
        return {
          title: 'Meeting updated',
          desc: `Changes have been made to your meeting on “${meeting.title}”.`,
        };
    }
  }

  async findAll(agent_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);

      const page = payload?.page ? Number(payload.page) : null;
      const limit = payload?.limit ? Number(payload.limit) : null;

      const isPaginated = page && limit;

      const skip = isPaginated ? (page - 1) * limit : undefined;
      const take = isPaginated ? limit : undefined;

      const where: any = {
        agent_id,
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
              description: {
                contains: payload.search,
                mode: 'insensitive',
              },
            },
            {
              mom: {
                contains: payload.search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      };

      const [meetings, total] = await Promise.all([
        this.prisma.meeting.findMany({
          where,
          ...(isPaginated && { skip, take }),
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            customer: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
              },
            },
            meeting_type: true,
            start_time: true,
            end_time: true,
            status: true,
            mom: true,
            is_completed: true,
            completed_at: true,
            reminder_before: true,
            reminder_sent: true,
            created_at: true,
          },
        }),
        this.prisma.meeting.count({ where }),
      ]);

      return {
        Meetings: meetings,
        Total: total
      };
    } catch (error) {
      throw error;
    }
  }


  async findOne(agent_id: bigint, meeting_id: bigint) {
    try {
      const meeting = await this.prisma.meeting.findFirst({
        where: {
          id: meeting_id,
          agent_id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          customer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
            },
          },
          meeting_type: true,
          start_time: true,
          end_time: true,
          status: true,
          mom: true,
          is_completed: true,
          completed_at: true,
          reminder_before: true,
          reminder_sent: true,
          created_at: true,
        },
      });

      if (!meeting) {
        throw new NotFoundException("Meeting not found");
      }

      return meeting;
    } catch (error) {
      throw error;
    }
  }


  async update(agent_id: bigint, meeting_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);

      const meeting = await this.prisma.meeting.findFirst({
        where: {
          id: meeting_id,
          agent_id,
        },
      });

      if (!meeting) {
        throw new NotFoundException("Meeting not found");
      }

      const isTimeUpdated =
        payload.start_time || payload.end_time || payload.reminder_before;

      const statusFromPayload = payload.status;
      let finalStatus: any = undefined;
      if (statusFromPayload) {
        finalStatus = statusFromPayload;
      } else if (isTimeUpdated) {
        finalStatus = "POSTPONED";
      }

      const updatedMeeting = await this.prisma.meeting.update({
        where: { id: meeting_id },
        data: {
          ...(payload.title && { title: payload.title }),
          ...(payload.desc && { description: payload.desc }),
          ...(payload.meetingType && { meeting_type: payload.meetingType }),

          ...(payload.customer_id && {
            customer: {
              connect: { id: BigInt(payload.customer_id) },
            },
          }),

          ...(payload.start_time && {
            start_time: new Date(payload.start_time),
          }),

          ...(payload.end_time && {
            end_time: new Date(payload.end_time),
          }),

          ...(payload.reminderBefore !== undefined && {
            reminder_before: payload.reminderBefore,
          }),

          ...(finalStatus && { status: finalStatus }),
          ...(isTimeUpdated && finalStatus !== "COMPLETED" && {
            reminder_sent: false,
          }),

          ...(finalStatus === "COMPLETED" && {
            is_completed: true,
            completed_at: new Date(),
          }),
        },
      });
      setImmediate(async () => {
        try {
          await this.mailService.sendMeetingEmail(updatedMeeting, 'updated');
          const notification: any = await this.getMeetingNotificationPayload(updatedMeeting, 'updated');

          await createNotification(
            agent_id,
            'MEETING',
            notification.title,
            notification.desc,
            {
              meeting_id: updatedMeeting.id,
              status: updatedMeeting.status,
              action: 'updated',
            }
          );
        } catch (error) {
          console.error("Error sending metting email", error);
        }
      });
      return updatedMeeting;
    } catch (error) {
      throw error;
    }
  }


  async remove(agent_id: bigint, meeting_id: bigint) {
    try {
      const meeting = await this.prisma.meeting.findFirst({
        where: {
          id: meeting_id,
          agent_id,
        },
      });

      if (!meeting) {
        throw new NotFoundException("Meeting not found");
      }

      await this.prisma.meeting.update({
        where: { id: meeting_id },
        data: {
          status: "CANCELLED",
        },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  async sendReminder() {
    try {
      const now = new Date();
      const DEFAULT_REMINDER_MINUTES = 15;

      const meetings = await this.prisma.meeting.findMany({
        where: {
          status: {
            in: ["SCHEDULED", "POSTPONED"],
          },
          reminder_sent: false,
          start_time: {
            gte: now,
          },
        },
        include: {
          agent: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          customer: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      for (const meeting of meetings) {
        const reminderMinutes =
          meeting.reminder_before !== null
            ? meeting.reminder_before
            : DEFAULT_REMINDER_MINUTES;

        const reminderTime = new Date(
          meeting.start_time.getTime() - reminderMinutes * 60 * 1000
        );

        if (now >= reminderTime) {
          const context = {
            email: meeting.agent.email,
            name: `${meeting.agent.first_name} ${meeting.agent.last_name}`,
            meetingTitle: meeting.title,
            meetingDesc: meeting.description,
            meeting_type: meeting.meeting_type,
            start_time: meeting.start_time,
            end_time: meeting.end_time,
            customerName: meeting.customer
              ? `${meeting.customer.first_name} ${meeting.customer.last_name}`
              : null,
          };

          await this.mailService.sendMeetingReminderEmail(context);

          await this.prisma.meeting.update({
            where: { id: meeting.id },
            data: {
              reminder_sent: true,
            },
          });
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }



}
