import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SettingsService } from 'src/settings/settings.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SettingsService],
})
export class SubscriptionModule { }
