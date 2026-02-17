import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res } from '@nestjs/common';
import { LocationService } from './location.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { ApiTags } from '@nestjs/swagger';
import { encryptData } from '@/common/helper/common.helper';
import { ApiResponse } from '@/common/helper/response.helper';
import type { Response } from 'express';

@ApiTags('Agent - location')
@Controller({ path: 'location', version: '1' })
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Get('states/:countryCode')
  async getStates(
    @Res() res: Response,
    @Param('countryCode') countryCode: string,) {
    try {
      const data = await this.locationService.getStatesByCountryCode(countryCode);
      const result = JSON.stringify(data, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'States fetched successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch states list.");
    }
  }

  @Get('cities/:countryCode/:state')
  async getCities(
    @Res() res: Response,
    @Param('countryCode') countryCode: string,
    @Param('state') state: string,
  ) {
    try {
      const data = await this.locationService.getCitiesByState(countryCode, state);
      const result = JSON.stringify(data, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'Cities fetched successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch City list.");
    }
  }

}
