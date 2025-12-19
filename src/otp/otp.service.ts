import { BadRequestException, Injectable } from '@nestjs/common';
import { SendOtpDto } from './dto/send-otp.dto';
import { verifyOtpDto } from './dto/verify-otp.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { decryptData, generateOTP } from 'src/helper/common.helper';
import { CommonDto } from 'src/auth/dto/common.dto';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService
  ) { }

  async sendOtp(dto: CommonDto): Promise<boolean> {
    try {
      const otpData = decryptData(dto.data);
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute
      const otp = generateOTP();

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

      if (otpData.is_email) {
        const subject = 'Email OTP Verification';

        setImmediate(async () => {
          try {
            await this.mailService.sendOTPEmail(
              subject,
              otpData.credential,
              otp,
            );
          } catch (error) {
            console.error('Error sending OTP email:', error);
          }
        });
      } else {
        // TODO: Send OTP via SMS
      }

      return true;
    } catch (error) {
      console.error('Send OTP failed:', error);
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
        throw new BadRequestException('OTP not found for this credential.');
      }

      if (otpRecord?.limit >= 3) {
        throw new BadRequestException('You tried too many attempts. Try again later.');
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
