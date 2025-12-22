import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request, Response } from 'express';
import { ApiResponse } from 'src/helper/response.helper';
import { encryptData } from 'src/helper/common.helper';


@Controller({ path: 'plan', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post("sync")
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

  @Get()
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Res() res: Response, @Body() updateSubscriptionDto: CommonDto) {
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
