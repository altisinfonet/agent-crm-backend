import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, BadRequestException, HttpStatus } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { verifyOtpDto } from './dto/verify-otp.dto';
import { ApiResponse } from 'src/helper/response.helper';
import type { Request, Response } from 'express';

@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(private readonly otpService: OtpService) { }

  @Post('send')
  async sendOtp(@Body() dto: SendOtpDto, @Req() req: Request, @Res() res: Response) {
    try {
      let result = await this.otpService.sendOtp(dto);
      if (result) {
        return res.status(HttpStatus.OK).json(new ApiResponse(null, "OTP sent"));
      } else {
        throw new BadRequestException(new ApiResponse(null, 'Invalid Credential.', false));
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Post('verify')
  async verifyOtp(@Body() dto: verifyOtpDto, @Req() req: Request, @Res() res: Response) {
    try {
      let result = await this.otpService.verifyOtp(dto);
      if (result) {
        return res.status(HttpStatus.OK).json(new ApiResponse(null, "OTP verified"));
      } else {
        throw new BadRequestException(new ApiResponse(null, 'Invalid Credential.', false));
      }
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.otpService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.otpService.remove(+id);
  }
}
