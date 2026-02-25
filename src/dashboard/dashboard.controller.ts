import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put, Res, BadRequestException, HttpStatus, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { AccountStatusGuard } from '@/common/guards/status.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Account } from '@/common/enum/account.enum';
import { AccountStatus } from '@/common/decorators/status.decorator';
import { Response } from 'express';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { encryptData } from '@/common/helper/common.helper';
import { ApiResponse } from '@/common/helper/response.helper';

@ApiTags('Agent - dashboard')
@ApiBearerAuth('access-token')
@Controller({ path: 'agent/dashboard', version: '1' })
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@AccountStatus(Account.ACTIVE)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('customer')
  @ApiOperation({ summary: 'Get customer dashboard data for logged-in agent' })
  @SwaggerApiResponse({ status: 200, description: 'Customer dashboard data fetched successfully' })
  async customerData(
    @Res() res: Response,
    @GetCurrentUserId() userId: bigint,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    try {
      const dashboard = await this.dashboardService.customerData(
        userId,
        startDate,
        endDate,
      );
      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All customer dashboard data."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch customer dashboard data.");
    }
  }

  @Get('meetings')
  @ApiOperation({ summary: 'Get meetings dashboard data for logged-in agent' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Meetings dashboard data fetched successfully',
  })
  async meetingsData(
    @Res() res: Response,
    @GetCurrentUserId() userId: bigint,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    try {
      const pageNumber = page ? Number(page) : undefined;
      const limitNumber = limit ? Number(limit) : undefined;
      const normalizedPage = Number.isFinite(pageNumber) ? pageNumber : undefined;
      const normalizedLimit = Number.isFinite(limitNumber) ? limitNumber : undefined;

      const dashboard =
        await this.dashboardService.agentMeetingDashboard(
          userId,
          normalizedPage,
          normalizedLimit,
          startDate,
          endDate,
        );

      const result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'All meeting dashboard data.'),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException(
        'Failed to fetch meetings dashboard data.',
      );
    }
  }

  @Get('todos')
  @ApiOperation({ summary: 'Get todos dashboard data for logged-in agent' })
  @SwaggerApiResponse({ status: 200, description: 'Todos dashboard data fetched successfully' })
  async todosData(
    @Res() res: Response,
    @GetCurrentUserId() userId: bigint,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    try {
      const pageNumber = page ? Number(page) : undefined;
      const limitNumber = limit ? Number(limit) : undefined;
      const normalizedPage = Number.isFinite(pageNumber) ? pageNumber : undefined;
      const normalizedLimit = Number.isFinite(limitNumber) ? limitNumber : undefined;

      const dashboard = await this.dashboardService.agentTodoDashboard(
        userId,
        normalizedPage,
        normalizedLimit,
        startDate,
        endDate,
      );
      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All todos dashboard data."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch todos dashboard data.");
    }
  }
}
