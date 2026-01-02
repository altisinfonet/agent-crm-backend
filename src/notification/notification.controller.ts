import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import type { Response } from 'express';
import { ApiResponse } from '@/helper/response.helper';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { encryptData } from '@/helper/common.helper';


@Controller({ path: 'notification', version: '1' })
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post('fcm-tokens')
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

  @Put("in-app/list")
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationService.remove(+id);
  }
}
