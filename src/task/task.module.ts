import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { SettingsService } from 'src/settings/settings.service';


@Module({
    imports: [],
    providers: [TaskService, SettingsService]
})
export class TaskModule { }
