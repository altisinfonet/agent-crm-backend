import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import type { Response } from 'express';
import { ApiResponse } from '@/helper/response.helper';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { encryptData } from '@/helper/common.helper';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';


@ApiTags('Agent - Notifications')
@ApiBearerAuth('access-token')
@Controller({ path: 'notification', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post('fcm-token')
  @ApiOperation({ summary: 'Add or update FCM token for push notifications' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'FCM token added successfully' })
  async AddFCMToken(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Body() dto: CommonDto) {
    try {
      const notification = await this.notificationService.AddFCMToken(userId, dto);
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "FCM token added."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Post('send')
  @ApiOperation({ summary: 'Send push notification to users' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(@Res() res: Response, @Body() sendNotificationDto: CommonDto,
  ) {
    try {
      const notification = await this.notificationService.sendNotification(sendNotificationDto);
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Send firbase notification"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Put('in-app/list')
  @ApiOperation({ summary: 'Get in-app notifications for logged-in user' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'In-app notification list fetched successfully' })
  async findAll(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Body() inAppNotificationDto: CommonDto,) {
    try {
      const preference = await this.notificationService.findAll(userId, inAppNotificationDto);
      let result = JSON.stringify(preference, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All in-app notification list."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Post('read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @SwaggerApiResponse({ status: 200, description: 'Notifications marked as read' })
  async readNotifications(@Res() res: Response, @GetCurrentUserId() userId: bigint,) {
    try {
      const notification = await this.notificationService.readNotifications(userId);
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All notifications read."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Post('hbd')
  @ApiOperation({ summary: 'Send birthday notifications to agents' })
  @SwaggerApiResponse({ status: 200, description: 'Birthday notifications sent successfully' })
  async sendHBDNotifications(@Res() res: Response) {
    try {
      const notification = await this.notificationService.sendHBDNotifications();
      let result = JSON.stringify(notification, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Birthday notification sended to agents."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

}
