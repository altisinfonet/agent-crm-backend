import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request, Response } from 'express';
import { ApiResponse } from 'src/helper/response.helper';
import { encryptData } from 'src/helper/common.helper';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin - Subscriptions')
@ApiBearerAuth('access-token')
@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post('sync/plan')
  @ApiOperation({ summary: 'Sync subscription plans from Razorpay (Admin)' })
  @SwaggerApiResponse({ status: 200, description: 'Subscription plans synced successfully' })
  async create(@Res() res: Response) {
    try {
      const plans = await this.subscriptionService.syncPlan();
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription plan created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get('plan/list')
  @ApiOperation({ summary: 'Get all subscription plans (Admin)' })
  @SwaggerApiResponse({ status: 200, description: 'All subscription plans fetched' })
  async findAll(@Res() res: Response) {
    try {
      const plans = await this.subscriptionService.findAllPlans();
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All subscription plans."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get('plan/:id')
  @ApiOperation({ summary: 'Get subscription plan by ID (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Subscription plan fetched' })
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const plans = await this.subscriptionService.findOne(BigInt(id));
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All subscription plans."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Admin upgrade organization subscription' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Subscription upgraded successfully' })
  async adminGrantSubscription(
    @Res() res: Response,
    @Body() upgradeDto: CommonDto,
  ) {
    try {
      const plans = await this.subscriptionService.adminUpgradeSubscription(upgradeDto);
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Admin subscription upgraded."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }


  @Post('grant')
  @ApiOperation({ summary: 'Admin assign subscription to agent/organization' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Subscription granted successfully' })
  async adminAssignSubscriptionToAgent(
    @Res() res: Response,
    @Body() grantDto: CommonDto,
  ) {
    try {
      const plans = await this.subscriptionService.adminAssignSubscriptionToAgent(grantDto);
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Admin subscription grant."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Patch('plan/:id')
  @ApiOperation({ summary: 'Update subscription plan (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Subscription plan updated successfully' })
  async update(
    @Param('id') id: string,
    @Res() res: Response,
    @Body() updateSubscriptionDto: CommonDto,
  ) {
    try {
      const plans = await this.subscriptionService.updatePlan(BigInt(id), updateSubscriptionDto);
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription plan updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Put('subscribers')
  @ApiOperation({ summary: 'Get all subscription subscribers (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Subscribers list fetched successfully' })
  async subscribers(
    @Res() res: Response,
    @Body() subscribersDto: CommonDto,
  ) {
    try {
      const plans = await this.subscriptionService.subscribers(subscribersDto);
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All subscribers list."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
