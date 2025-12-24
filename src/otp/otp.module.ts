import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { MailService } from '@/mail/mail.service';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule { }
