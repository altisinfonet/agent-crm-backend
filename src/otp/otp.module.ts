import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [OtpController],
  providers: [OtpService, MailService],
})
export class OtpModule { }
