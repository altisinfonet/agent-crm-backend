import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { SettingsService } from 'src/settings/settings.service';
import { NotificationModule } from '@/notification/notification.module';


@Module({
    imports: [NotificationModule],
    providers: [TaskService, SettingsService]
})
export class TaskModule { }
