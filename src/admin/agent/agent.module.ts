import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { SubscriptionService } from '@/subscription/subscription.service';
import { SettingsService } from '@/settings/settings.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, SubscriptionService, SettingsService],
})
export class AgentModule { }
