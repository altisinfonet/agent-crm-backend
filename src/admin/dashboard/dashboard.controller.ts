import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, BadRequestException, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role } from '@/common/enum/role.enum';
import { Roles } from '@/common/decorators/roles.decorator';
import { CommonDto } from '@/auth/dto/common.dto';
import type { Response } from 'express';
import { ApiResponse } from '@/helper/response.helper';

@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Post()
  async create(@Res() res: Response, @Body() createDashboardDto: CommonDto) {
    try {
      const faq = await this.dashboardService.create(createDashboardDto);
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faqs."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get("total")
  async findTotal(@Res() res: Response) {
    try {
      const dashboard = await this.dashboardService.findTotal();

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Dashboard."));

    } catch (error) {
      throw new BadRequestException(error?.response);
    }
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDashboardDto: CommonDto) {
    return this.dashboardService.update(+id, updateDashboardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dashboardService.remove(+id);
  }
}
