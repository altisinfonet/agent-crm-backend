import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { CommonDto } from '@/auth/dto/common.dto';
import type { Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';


@Controller({ path: 'whatsapp', version: '1' })
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) { }

  @Post("send-otp")
  async sendOtp(@Res() res: Response, @Body() sendOtpDto: any) {
    try {
      let otp = await this.whatsappService.sendOtp(sendOtpDto);
      let result = JSON.stringify(otp, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "OTP send through WhatsApp successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get()
  findAll() {
    return this.whatsappService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.whatsappService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWhatsappDto: CommonDto) {
    return this.whatsappService.update(+id, updateWhatsappDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.whatsappService.remove(+id);
  }
}
