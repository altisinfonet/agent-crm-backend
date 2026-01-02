import { Module } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [MeetingController],
  providers: [MeetingService],
})
export class MeetingModule { }
