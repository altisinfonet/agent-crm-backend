import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, Put, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { encryptData } from 'src/helper/common.helper';
import { ApiResponse } from 'src/helper/response.helper';
import type { Response } from 'express';
import { Role } from 'src/common/enum/role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) { }

  @Post()
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
