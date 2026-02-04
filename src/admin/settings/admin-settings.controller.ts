import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Req, Put, Query } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { ApiResponse } from '@/common/helper/response.helper';
import { AdminSettingsService } from './admin-settings.service';
import { encryptData } from '@/common/helper/common.helper';
import { CommonDto } from 'src/auth/dto/common.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin - Settings')
@ApiBearerAuth('access-token')
@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSettingsController {

  constructor(
    private readonly adminSettingsService: AdminSettingsService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create admin settings (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Settings created successfully' })
  async create(
    @Res() res: Response,
    @Body() createAdminSettingDto: CommonDto,
    @Req() req: Request,
  ) {
    try {
      const settings = await this.adminSettingsService.create(createAdminSettingDto);
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Settings created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get admin settings (Admin)' })
  @SwaggerApiResponse({ status: 200, description: 'Settings fetched successfully' })
  async findAll(
    @Res() res: Response,
    @Query('setting') setting?: string,
  ) {
    try {
      const settings = await this.adminSettingsService.findAll(setting);
      const result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse(JSON.parse(result), "Settings."));
      return res.status(HttpStatus.OK).json({ data: resData });

    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin settings by ID (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Settings fetched successfully' })
  findOne(@Param('id') id: string) {
    return this.adminSettingsService.findOne(+id);
  }


  @Patch(':id')
  @ApiOperation({ summary: 'Update admin settings (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Settings updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateAdminSettingDto: CommonDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const settings = await this.adminSettingsService.update(BigInt(id), updateAdminSettingDto);
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Settings updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException((error.response));
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete admin settings (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Settings deleted successfully' })
  remove(@Param('id') id: string) {
    return this.adminSettingsService.remove(+id);
  }
}
