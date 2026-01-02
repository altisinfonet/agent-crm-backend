import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { MailModule } from '@/mail/mail.module';
import { WhatsappModule } from '@/whatsapp/whatsapp.module';

@Module({
  imports: [MailModule, WhatsappModule],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule { }
