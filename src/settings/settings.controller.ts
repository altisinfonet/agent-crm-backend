import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CommonDto } from '@/auth/dto/common.dto';
import type { Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
import { ApiExcludeEndpoint } from '@nestjs/swagger';


@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @Post()
  create(@Body() createSettingDto: CommonDto) {
    return this.settingsService.create(createSettingDto);
  }

  @Get('payment')
  @ApiExcludeEndpoint()
  async paymentSettings(@Res() res: Response) {
    try {
      const settings = await this.settingsService.paymentSettings();
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Razorpay Payment settings"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.settingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSettingDto: CommonDto) {
    return this.settingsService.update(+id, updateSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.settingsService.remove(+id);
  }
}
