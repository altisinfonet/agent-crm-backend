import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { FormSuggestionModule } from '@/agent-form-suggestion/suggestion.module';

@Module({
  imports: [FormSuggestionModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule { }
