import { PartialType } from '@nestjs/swagger';
import { CreateAgentFormSuggestionDto } from './create-agent-form-suggestion.dto';

export class UpdateAgentFormSuggestionDto extends PartialType(CreateAgentFormSuggestionDto) {}
