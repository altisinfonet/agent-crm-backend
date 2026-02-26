import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, UseGuards, Res, Req, Headers } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { encryptData } from '@/common/helper/common.helper';
import { ApiResponse } from '@/common/helper/response.helper';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AccountStatusGuard, ApprovalStatusGuard } from '@/common/guards/status.guard';
import { Account, Approve } from '@/common/enum/account.enum';
import { AccountStatus, ApprovalStatus } from '@/common/decorators/status.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiExcludeEndpoint,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('Agent - Subscriptions')
@ApiBearerAuth('access-token')
@Controller({ path: 'subscription', version: '1' })
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @SwaggerApiResponse({ status: 200, description: 'Subscription plans fetched successfully' })
  async allPlans(@Res() res: Response) {
    try {
      const plans = await this.subscriptionService.allPlans();
      let result = JSON.stringify(plans, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All Plans"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read subscription plans.");
    }
  }

  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Post('subscribe/:id')
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiParam({ name: 'id', description: 'Subscription plan ID', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Subscription initiated successfully' })
  async create(@Res() res: Response, @Param('id') id: string, @GetCurrentUserId() userId: bigint,) {
    try {
      const subscribe = await this.subscriptionService.subscribe(userId, BigInt(id));
      let result = JSON.stringify(subscribe, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription initiated"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to initiate subscription.");
    }
  }

  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Post("payment")
  @ApiExcludeEndpoint()
  async subscriptionPayment(
    @Req() req: Request,
    @Res() res: Response,
    @Body() dto: CommonDto,
  ) {
    try {
      const payment = await this.subscriptionService.subscriptionPayment(dto);
      let result = JSON.stringify(payment, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      console.log("payment", payment);
      console.log("result", result);


      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription payment initiated"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      console.log("error:::::::", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to process payment.");
    }
  }


  @Post("webhook")
  @ApiExcludeEndpoint()
  async razorpayWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-razorpay-signature') razorpaySignature: string
  ) {
    try {
      const rawBody = req.body;
      const webhook = await this.subscriptionService.razorpayWebhook(rawBody, razorpaySignature);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Webhook processed successfully' });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to process webhook.");
    }
  }


  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Get()
  @ApiOperation({ summary: 'Get current subscription details' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  async getSubscription(@Res() res: Response, @GetCurrentUserId() userId: bigint,) {
    try {
      const subscribe = await this.subscriptionService.getSubscriptionDetails(userId);
      let result = JSON.stringify(subscribe, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription retrieved"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to retrieve subscription.");
    }
  }


  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade current subscription plan' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Subscription upgraded successfully' })
  async upgradeSubscription(@Res() res: Response, @Body() upgradedDto: CommonDto, @GetCurrentUserId() userId: bigint,) {
    try {
      const subscribe = await this.subscriptionService.upgradeSubscription(userId, upgradedDto);
      let result = JSON.stringify(subscribe, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription upgraded"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to upgrade subscription.");
    }
  }


  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Post('cancel')
  @ApiOperation({ summary: 'Cancel active subscription (at cycle end)' })
  @SwaggerApiResponse({ status: 200, description: 'Subscription cancellation requested' })
  async cancelSubscription(@Res() res: Response, @GetCurrentUserId() userId: bigint,) {
    try {
      const subscribe = await this.subscriptionService.cancelSubscription(userId);
      let result = JSON.stringify(subscribe, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription cancelled"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      console.log("Failed to cancel subscription", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to cancel subscription.");
    }
  }


  @Patch(':id')
  @ApiExcludeEndpoint()
  update(@Param('id') id: string, @Body() updateSubscriptionDto: CommonDto) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  @ApiExcludeEndpoint()
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
