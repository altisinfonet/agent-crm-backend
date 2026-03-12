import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationModule } from '@/notification/notification.module';
import { MailModule } from '@/mail/mail.module';
import { MeetingService } from '@/meeting/meeting.service';
import { TodoModule } from '@/todo/todo.module';


@Module({
    imports: [NotificationModule, MailModule, TodoModule],
    providers: [TaskService, SettingsService, MeetingService]
})
export class TaskModule { }

