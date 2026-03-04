import { Module } from '@nestjs/common';
import { FormSuggestionService } from './suggestion.service';
import { FormSuggestionController } from './suggestion.controller';

@Module({
  controllers: [FormSuggestionController],
  providers: [FormSuggestionService],
  exports: [FormSuggestionService]
})
export class FormSuggestionModule { }
