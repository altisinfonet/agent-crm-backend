import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, UseGuards, Res, Req, Headers } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { encryptData } from 'src/helper/common.helper';
import { ApiResponse } from 'src/helper/response.helper';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@Controller({ path: 'subscription', version: '1' })
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }
  @UseGuards(JwtAuthGuard)
  @Post("subscribe")
  async create(@Res() res: Response, @Body() subscribeDto: CommonDto, @GetCurrentUserId() userId: bigint,) {
    try {
      const subscribe = await this.subscriptionService.subscribe(userId, subscribeDto);
      let result = JSON.stringify(subscribe, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Subscription initiated"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @Post("webhook")
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
      throw new BadRequestException(error.response);
    }
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubscriptionDto: CommonDto) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
