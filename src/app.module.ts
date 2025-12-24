import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MailService } from './mail/mail.service';
import { OtpModule } from './otp/otp.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './task/task.module';
import { MeetingModule } from './meeting/meeting.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    TaskModule,
    PrismaModule,
    AuthModule,
    AdminModule,
    OtpModule,
    UserModule,
    ProductsModule,
    SettingsModule,
    SubscriptionModule,
    MeetingModule,
    NotificationModule
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule { }
