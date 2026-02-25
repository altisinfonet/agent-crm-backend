import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AccountStatusGuard } from '@/common/guards/status.guard';
import { Account } from '@/common/enum/account.enum';
import { AccountStatus } from '@/common/decorators/status.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags, ApiResponse as SwaggerApiResponse, } from '@nestjs/swagger';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';


@ApiTags('Agent')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@AccountStatus(Account.ACTIVE)
@Controller({ path: 'agent/sales', version: '1' })
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

  @Post()
  create(@Body() createAgentDto: CommonDto) {
    return this.agentService.create(createAgentDto);
  }


  @Put('list')
  @ApiOperation({ summary: 'Get agent sales list' })
  @SwaggerApiResponse({ status: 200, description: 'Agent sales list fetched successfully' })
  async findAll(
    @Res() res: Response,
    @GetCurrentUserId() userId: bigint,
    @Body() getSalesDto: CommonDto) {
    try {
      const customer = await this.agentService.findAllSales(userId, getSalesDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agent sales list fetched successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch agent sales list.");
    }
  }

  @Get(":id")
  @ApiOperation({ summary: 'Get agent sale' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Agent sales list fetched successfully' })
  async findOne(@Res() res: Response,
    @GetCurrentUserId() userId: bigint,
    @Param('id') sale_id: string,) {
    try {
      const customer = await this.agentService.findOneSale(userId, BigInt(sale_id));
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agent sale fetched successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch agent sale.");
    }
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgentDto: CommonDto) {
    return this.agentService.update(+id, updateAgentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentService.remove(+id);
  }
}
