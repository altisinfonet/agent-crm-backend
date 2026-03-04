import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, Res, BadRequestException, UseGuards } from '@nestjs/common';
import { FormSuggestionService } from './suggestion.service';
import { CreateAgentFormSuggestionDto } from './dto/create-agent-form-suggestion.dto';
import { UpdateAgentFormSuggestionDto } from './dto/update-agent-form-suggestion.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse as SwaggerApiResponse, } from '@nestjs/swagger';
import { decryptData, encryptData } from '@/common/helper/common.helper';
import { ApiResponse } from '@/common/helper/response.helper';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { CommonDto } from '@/auth/dto/common.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AccountStatusGuard } from '@/common/guards/status.guard';
import { SubscriptionGuard } from '@/common/guards/subscription.guard';
import { Account } from '@/common/enum/account.enum';
import { AccountStatus } from '@/common/decorators/status.decorator';

@UseGuards(JwtAuthGuard, AccountStatusGuard, SubscriptionGuard)
@AccountStatus(Account.ACTIVE)
@Controller({ path: 'form-suggestion', version: '1' })
export class FormSuggestionController {
  constructor(private readonly agentFormSuggestionService: FormSuggestionService) { }

  @Post(':saleId')
  @ApiOperation({ summary: 'Store agent form suggestions from product form' })
  @ApiParam({ name: 'saleId', description: 'Sale ID', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Suggestions stored successfully' })
  async createSuggestions(
    @Res() res: Response,
    @GetCurrentUserId() userId: bigint,
    @Param('saleId') saleId: string,
    @Body() suggestionDto: CommonDto
  ) {
    // try {
    //   const payload = decryptData(suggestionDto.data);
    //   const suggestions = await this.agentFormSuggestionService.createSuggestions(
    //     userId,
    //     BigInt(saleId),
    //     payload
    //   );
    //   const result = JSON.stringify(suggestions, (key, value) =>
    //     typeof value === 'bigint' ? value.toString() : value
    //   );
    //   const resData = encryptData(
    //     new ApiResponse(JSON.parse(result), "Suggestions stored successfully.")
    //   );
    //   return res.status(HttpStatus.OK).json({ data: resData });
    // } catch (error: any) {
    //   if (error.status && error.response) {
    //     return res.status(error.status).json(error.response);
    //   }
    //   throw new BadRequestException("Failed to store suggestions.");
    // }
  }

  @Get()
  @ApiOperation({ summary: 'Fetch agent form suggestions' })
  @ApiParam({ name: 'product', description: 'product', example: "INSURANCE" })
  @SwaggerApiResponse({ status: 200, description: 'Suggestions fetched successfully' })
  async findAll(
    @Res() res: Response,
    @GetCurrentUserId() userId: bigint,
    @Query('product') product?: string,
    @Query('field') field?: string,
  ) {
    try {
      const suggestions = await this.agentFormSuggestionService.getSuggestions(
        userId,
        product,
        field
      );
      const result = JSON.stringify(suggestions, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
      const resData = encryptData(
        new ApiResponse(JSON.parse(result), "Suggestions fetched successfully.")
      );
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch suggestions.");
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentFormSuggestionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgentFormSuggestionDto: UpdateAgentFormSuggestionDto) {
    return this.agentFormSuggestionService.update(+id, updateAgentFormSuggestionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentFormSuggestionService.remove(+id);
  }
}
