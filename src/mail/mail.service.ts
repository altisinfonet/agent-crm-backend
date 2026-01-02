import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MailService {
    constructor(
        private readonly mailer: MailerService,
        private prisma: PrismaService,
    ) { }

    async sendOTPEmail(subject: string, email: string, otp: string) {
        try {
            const mailOptions = {
                to: email,
                subject: subject,
                template: './otp-email',
                context: {
                    otp: otp,
                    currentYear: new Date().getFullYear()
                }
            };
            await this.mailer.sendMail(mailOptions);
        } catch (error) {
            throw error
        }
    }

    async sendResetPasswordEmail(email: string, resetLink: string, token: string = '', expiry_minutes: number) {
        console.log("resetLink", resetLink);

        const mailOptions = {
            to: email,
            subject: 'Reset your password',
            template: './forgot-password',
            context: {
                code: token,
                expiry_minutes: expiry_minutes,
                currentYear: new Date().getFullYear(),
                reset_link: resetLink,
            }
        };

        await this.mailer.sendMail(mailOptions);
    }


    async sendMeetingEmail(meeting: any, action: 'created' | 'updated') {
        try {
            const agent = await this.prisma.user.findUnique({
                where: { id: meeting.agent_id }
            });

            if (!agent || !agent.email) {
                console.warn(`No email found for agent ${meeting.agent_id}`);
                return;
            }

            // const formatDate = (date: Date) => {
            //     return new Date(date).toLocaleDateString('en-US', {
            //         weekday: 'long',
            //         year: 'numeric',
            //         month: 'long',
            //         day: 'numeric',
            //         hour: '2-digit',
            //         minute: '2-digit'
            //     });
            // };

            let customer: any = null;
            if (meeting.customer_id) {
                customer = await this.prisma.customer.findUnique({
                    where: { id: meeting.customer_id }
                });
            }

            const meetingData = {
                title: meeting.title,
                description: meeting.description,
                start_time: (meeting.start_time),
                end_time: (meeting.end_time),
                meeting_type: meeting.meeting_type,
                status: meeting.status,
                reminder_before: meeting.reminder_before,
                mom: meeting.mom,
                agent: {
                    name: `${agent.first_name} ${agent.last_name}` || 'Agent'
                },
                customer: customer ? { name: `${customer.first_name} ${customer.last_name}` } : null,
                meetingUrl: `${process.env.WEB_BASE_PATH}/meetings/${meeting.id}`,
                currentYear: new Date().getFullYear()
            };

            const subject = `Meeting ${meeting.status === 'CANCELLED' ? 'Cancelled' :
                meeting.status === 'COMPLETED' ? 'Completed' :
                    meeting.status === 'POSTPONED' ? 'Rescheduled' : 'Scheduled'}: ${meeting.title}`;

            const mailOptions = {
                to: agent.email,
                subject: subject,
                template: './meeting-notification',
                context: meetingData
            };
            try {
                const send = await this.mailer.sendMail(mailOptions);
                return true;
            } catch (error) {
                console.warn('Error sending meeting email.', error);
            }

            if (meeting.status === 'SCHEDULED') {
                await this.prisma.meeting.update({
                    where: { id: meeting.id },
                    data: { reminder_sent: true }
                });
            }
        } catch (error) {
            console.error('Error sending meeting email', error);
        }
    }

    async sendMeetingReminderEmail(context: any) {
        try {
            const subject = `Meeting Reminder: ${context?.meetingTitle}`
            const mailOptions = {
                to: context.email,
                subject: subject,
                template: './meeting-notification',
                context: {
                    name: context?.name,
                    meetingTitle: context?.meetingTitle,
                    meetingDesc: context?.meetingDesc,
                    meetingType: context?.meeting_type,
                    meetingTime: context?.start_time,
                    meetingEnd: context?.end_time,
                    customerName: context.customerName,
                    currentYear: new Date().getFullYear()
                }
            };
            try {
                const send = await this.mailer.sendMail(mailOptions);
                return true;
            } catch (error) {
                console.warn('Error sending reminder email.', error);
            }
        } catch (error) {
            console.error('Error sending reminder email', error);
        }
    }


    async sendHBDEmail(email: string, name: string) {
        try {
            const mailOptions = {
                to: email,
                subject: `Happy Birthday, ${name} 🎉`,
                template: './birthday-wish',
                context: {
                    name: name,
                    currentYear: new Date().getFullYear()
                }
            };
            const send = await this.mailer.sendMail(mailOptions);
            return true;

        } catch (error) {
            console.error('Error sending meeting email', error);
        }
    }
}