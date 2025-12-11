import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CryptoUtil } from 'src/common/utils/crypto.util';
import { randomUUID } from 'crypto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class OtpService {
    constructor(
        private prisma: PrismaService,
        private mailservice: MailService
    ) { }


    async generateOtp(dto: any) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const delivery_id = randomUUID();
        const otp_hash = CryptoUtil.hash(otp);
        const subject = "Email OTP Verification"

        await this.prisma.otp.create({
            data: {
                delivery_id,
                destination: dto.destination,
                channel: dto.channel,
                purpose: dto.auth_type,
                otp_hash,
                expires_at: new Date(Date.now() + 5 * 60 * 1000),
            },
        });

        setImmediate(async () => {
            try {
                await this.mailservice.sendOTPEmail(subject, dto.destination, otp);
            } catch (error) {
                console.error("Error sending OTP", error);
            }
        })

        console.log(`OTP for ${dto.destination}: ${otp}`); // TEMP FOR DEV ONLY

        return { delivery_id };
    }

    async verifyOtp(delivery_id: string, otp: string) {
        const record = await this.prisma.otp.findUnique({
            where: { delivery_id },
        });

        if (!record || record.used || record.expires_at < new Date()) {
            throw new UnauthorizedException('OTP expired or invalid');
        }

        const valid = CryptoUtil.compareHash(otp, record.otp_hash);
        if (!valid) throw new UnauthorizedException('Invalid OTP');

        await this.prisma.otp.update({
            where: { delivery_id },
            data: { used: true },
        });

        return true;
    }
}
