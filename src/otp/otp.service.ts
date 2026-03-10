import { BadRequestException, Injectable } from '@nestjs/common';
import { SendOtpDto } from './dto/send-otp.dto';
import { verifyOtpDto } from './dto/verify-otp.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { decryptData, generateOTP } from '@/common/helper/common.helper';
import { WhatsappService } from '@/whatsapp/whatsapp.service';
import { CommonDto } from '@/auth/dto/common.dto';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private whatsappService: WhatsappService
  ) { }

  async sendOtp(dto: CommonDto): Promise<boolean> {
    try {
      const otpData = decryptData(dto.data);
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute
      const otp =
        (otpData.credential === "demowithsubscription@gmail.com" ||
          otpData.credential === "demowithoutsubscription@gmail.com")
          ? "111111" : generateOTP();

      await this.prisma.oTP.upsert({
        where: {
          credential: otpData.credential,
        },
        update: {
          otp,
          limit: 0,
          restrictedTime: null,
          is_email: otpData.is_email,
          expires_at: expiresAt,
        },
        create: {
          credential: otpData.credential,
          otp,
          limit: 0,
          is_email: otpData.is_email,
          expires_at: expiresAt,
        },
      });

      setImmediate(async () => {
        try {
          if (otpData.is_email) {
            const subject = 'Email OTP Verification';
            await this.mailService.sendOTPEmail(
              subject,
              otpData.credential,
              otp,
            );
          } else {

          }
        } catch (error) {
          console.error('Error sending OTP', error);
        }
      });
      return true;
    } catch (error) {
      console.error('Error sending OTP', error);
      throw error;
    }
  }

  async verifyOtp(dto: verifyOtpDto) {
    try {
      const otpRecord = await this.prisma.oTP.findFirst({
        where: {
          credential: dto.credential,
        },
        select: {
          id: true,
          otp: true,
          limit: true,
          expires_at: true,
          updated_at: true
        }
      });

      if (!otpRecord) {
        throw new BadRequestException('Invalid credential.');
      }

      const now = new Date();
      if (otpRecord.expires_at < now) {
        throw new BadRequestException('OTP has expired.');
      }

      if (otpRecord.otp !== dto.otp) {
        await this.prisma.oTP.update({
          where: { id: otpRecord.id },
          data: {
            limit: { increment: 1 },
            updated_at: new Date()
          }
        });
        throw new BadRequestException('Invalid OTP.');
      }

      await this.prisma.oTP.delete({
        where: { id: otpRecord.id }
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} otp`;
  }

  remove(id: number) {
    return `This action removes a #${id} otp`;
  }
}
