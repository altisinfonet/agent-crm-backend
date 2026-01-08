import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FirebaseAdminService } from '@/common/utils/firebase.utils';
import { MailModule } from '@/mail/mail.module';
import { WhatsappModule } from '@/whatsapp/whatsapp.module';

@Module({
  imports: [MailModule, WhatsappModule],
  controllers: [NotificationController],
  providers: [NotificationService, FirebaseAdminService],
  exports: [NotificationService],
})
export class NotificationModule { }
