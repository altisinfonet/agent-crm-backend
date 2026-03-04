import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationModule } from '@/notification/notification.module';
import { MailModule } from '@/mail/mail.module';
import { MeetingService } from '@/meeting/meeting.service';


@Module({
    imports: [NotificationModule, MailModule],
    providers: [TaskService, SettingsService, MeetingService]
})
export class TaskModule { }
