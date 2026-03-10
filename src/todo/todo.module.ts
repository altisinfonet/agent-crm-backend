import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { NotificationModule } from '@/notification/notification.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [MailModule, NotificationModule],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule { }
