import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Req, HttpStatus, BadRequestException, Put, UseGuards } from '@nestjs/common';
import { CountryService } from './country.service';
import type { Request, Response } from 'express';
import { encryptData } from '@/common/helper/common.helper';
import { CommonDto } from 'src/auth/dto/common.dto';
import { ApiResponse } from '@/common/helper/response.helper';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin - Countries')
@ApiBearerAuth('access-token')
@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CountryController {
  constructor(private readonly countryService: CountryService) { }


  @Post()
  @ApiOperation({ summary: 'Create country (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Country created successfully' })
  async create(
    @Res() res: Response,
    @Body() createCountryDto: CommonDto,
    @Req() req: Request,
  ) {
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

  @Put('list')
  @ApiOperation({ summary: 'Get list of countries (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Countries fetched successfully' })
  async findAll(
    @Res() res: Response,
    @Body() commonDto: CommonDto,
  ) {
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
  @ApiOperation({ summary: 'Get country by ID (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Country fetched successfully' })
  async findOne(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
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
  @ApiOperation({ summary: 'Update country (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Country updated successfully' })
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
  @ApiOperation({ summary: 'Delete country (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Country deleted successfully' })
  async delete(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
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
