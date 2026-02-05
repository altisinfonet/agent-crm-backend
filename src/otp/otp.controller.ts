import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, BadRequestException, HttpStatus, UseGuards } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ApiResponse } from '@/common/helper/response.helper';
import type { Request, Response } from 'express';
import { CommonDto } from 'src/auth/dto/common.dto';
import { verifyOtpDto } from './dto/verify-otp.dto';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
@ApiTags('OTP')
@Controller({ path: 'otp', version: '1' })
export class OtpController {
  constructor(private readonly otpService: OtpService) { }

  @Post('send')
  async sendOtp(@Body() dto: CommonDto, @Req() req: Request, @Res() res: Response) {
    try {
      let result = await this.otpService.sendOtp(dto);
      if (result) {
        return res.status(HttpStatus.OK).json(new ApiResponse(null, "OTP sent"));
      } else {
        throw new BadRequestException(new ApiResponse(null, 'Invalid Credential.', false));
      }
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to send OTP.");
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
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to verify OTP.");
    }
  }

  @Get(':id')
  @ApiExcludeEndpoint()
  findOne(@Param('id') id: string) {
    return this.otpService.findOne(+id);
  }

  @Delete(':id')
  @ApiExcludeEndpoint()
  remove(@Param('id') id: string) {
    return this.otpService.remove(+id);
  }
}
