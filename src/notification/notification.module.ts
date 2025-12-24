import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FirebaseAdminService } from '@/utils/firebase.utils';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseAdminService],
})
export class NotificationModule { }
