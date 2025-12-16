import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Req, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { CountryService } from './country.service';
import type { Request, Response } from 'express';
import { encryptData } from 'src/helper/common.helper';
import { CommonDto } from 'src/auth/dto/common.dto';
import { ApiResponse } from 'src/helper/response.helper';

@Controller({ path: '', version: '1' })
export class CountryController {
  constructor(private readonly countryService: CountryService) { }


  @Post()
  async create(@Res() res: Response, @Body() createCountryDto: CommonDto,
    @Req() req: Request) {
    try {
      const settings = await this.countryService.create(createCountryDto);
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Country settings created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Put("list")
  async findAll(@Res() res: Response, @Body() commonDto: CommonDto,) {
    try {
      const data = await this.countryService.findAll(commonDto);

      const result = JSON.stringify(data, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'Countries fetched successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.countryService.findOne(BigInt(id));

      const result = JSON.stringify(data, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'Country fetched successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCountryDto: CommonDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.countryService.update(
        BigInt(id),
        updateCountryDto,
      );

      const result = JSON.stringify(data, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'Country updated successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.countryService.remove(BigInt(id));

      const resData = encryptData(
        new ApiResponse(null, 'Country deleted successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

}
