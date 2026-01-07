import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, Put, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { encryptData } from '@/common/helper/common.helper';
import { ApiResponse } from '@/common/helper/response.helper';
import type { Response } from 'express';
import { Role } from 'src/common/enum/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';


@ApiTags('Admin - Currencies')
@ApiBearerAuth('access-token')
@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) { }

  @Post()
  @ApiOperation({ summary: 'Create currency (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Currency created successfully' })
  async create(
    @Res() res: Response,
    @Body() dto: CommonDto,
  ) {
    try {
      const result = await this.currencyService.create(dto);

      const json = JSON.stringify(result, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const encrypted = encryptData(
        new ApiResponse(JSON.parse(json), 'Currency created successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: encrypted });
    } catch (error: any) {
      throw new BadRequestException(error.response || error.message);
    }
  }

  @Put('list')
  @ApiOperation({ summary: 'Get list of currencies (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Currency list fetched successfully' })
  async findAll(
    @Res() res: Response,
    @Body() dto: CommonDto,
  ) {
    try {
      const result = await this.currencyService.findAll(dto);

      const json = JSON.stringify(result, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const encrypted = encryptData(
        new ApiResponse(JSON.parse(json), 'Currency list fetched successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: encrypted });
    } catch (error: any) {
      throw new BadRequestException(error.response || error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get currency by ID (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Currency fetched successfully' })
  async findOne(
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    try {
      const result = await this.currencyService.findOne(BigInt(id));

      const json = JSON.stringify(result, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const encrypted = encryptData(
        new ApiResponse(JSON.parse(json), 'Currency fetched successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: encrypted });
    } catch (error: any) {
      throw new BadRequestException(error.response || error.message);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update currency (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Currency updated successfully' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() dto: CommonDto,
  ) {
    try {
      const result = await this.currencyService.update(BigInt(id), dto);

      const json = JSON.stringify(result, (k, v) =>
        typeof v === 'bigint' ? v.toString() : v,
      );

      const encrypted = encryptData(
        new ApiResponse(JSON.parse(json), 'Currency updated successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: encrypted });

    } catch (error) {
      throw new BadRequestException(error.response);
    }
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete currency (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Currency deleted successfully' })
  async remove(
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    try {
      await this.currencyService.remove(BigInt(id));

      const encrypted = encryptData(
        new ApiResponse(true, 'Currency deleted successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: encrypted });
    } catch (error: any) {
      throw new BadRequestException(error.response || error.message);
    }
  }
}
