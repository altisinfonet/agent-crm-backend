import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

export class MailService {
    constructor(
        private readonly mailer: MailerService,
        private config: ConfigService,
        private prisma: PrismaService,
    ) { }

    async sendOTPEmail(subject: string, email: string, otp: string) {
        try {
            const mailOptions = {
                to: email,
                subject: subject,
                template: './otp-email',
                context: {
                    otp: otp
                }
            };
            await this.mailer.sendMail(mailOptions);
        } catch (error) {
            throw error
        }
    }
}