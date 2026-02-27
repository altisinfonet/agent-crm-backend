import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request, Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
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

  @Post('plan/sync')
  @ApiOperation({ summary: 'Sync subscription plans from Razorpay (Admin)' })
  @SwaggerApiResponse({ status: 200, description: 'Subscription plans synced successfully' })
  async create(@Res() res: Response) {
    try {
      const plans = await this.subscriptionService.syncPlan();
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription plan synced successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log("Error syncing plan sync", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      if (error?.statusCode === 401) {
        throw new BadRequestException(
          "Invalid Razorpay API credentials. Please verify Key ID and Key Secret."
        );
      }
      throw new BadRequestException("Failed to sync subscription plans.");
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch subscription plans.");
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch subscription plan.");
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to upgrade subscription.");
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to assign subscription to agent.");
    }
  }

  @Post('cancel/:id')
  @ApiOperation({ summary: 'Cancel active subscription (at cycle end)' })
  @SwaggerApiResponse({ status: 200, description: 'Subscription cancellation requested' })
  async cancelSubscription(@Res() res: Response, @Param('id') agent_id: string) {
    try {
      const subscribe = await this.subscriptionService.cancelSubscription(BigInt(agent_id));
      let result = JSON.stringify(subscribe, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription cancelled"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to cancel subscription.");
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
      console.log("erorr", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update subscription plan.");
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch subscribers list.");
    }
  }

  @Delete('plan/:id')
  @ApiOperation({ summary: 'Delete subscription plan (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Subscription plan removed successfully' })
  async remove(
    @Param('id') id: string,
    @Res() res: Response) {
    try {
      const plans = await this.subscriptionService.removePlan(BigInt(id));
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription plan removed successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to remove subscription plan.");
    }
  }
}
