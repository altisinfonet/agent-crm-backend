import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards, Req, Put } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/helper/response.helper';
import { AdminSettingsService } from './admin-settings.service';
import { encryptData } from 'src/helper/common.helper';
import { CommonDto } from 'src/auth/dto/common.dto';



@Controller({ path: '', version: '1' })
export class AdminSettingsController {

  constructor(
    private readonly adminSettingsService: AdminSettingsService,
  ) { }

  @Post()
  async create(@Res() res: Response, @Body() createAdminSettingDto: CommonDto,
    @Req() req: Request) {
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

  @Put()
  async findAll(@Res() res: Response) {
    try {
      const settings = await this.adminSettingsService.findAll();
      let result = JSON.stringify(settings, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Settings."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminSettingsService.findOne(+id);
  }


  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAdminSettingDto: CommonDto,
    @Req() req: Request, @Res() res: Response) {
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminSettingsService.remove(+id);
  }
}
