import { Module } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { MailModule } from '@/mail/mail.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [MailModule, NotificationModule],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingModule]
})
export class MeetingModule { }
