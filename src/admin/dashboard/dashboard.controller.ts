import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, BadRequestException, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role } from '@/common/enum/role.enum';
import { Roles } from '@/common/decorators/roles.decorator';
import { CommonDto } from '@/auth/dto/common.dto';
import type { Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@Controller({ path: '', version: '1' })
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get("agents")
  @ApiOperation({ summary: 'Get agents data for admin' })
  @SwaggerApiResponse({ status: 200, description: 'Agents dashboard data fetched successfully' })
  async agentsData(@Res() res: Response) {
    try {
      const dashboard = await this.dashboardService.agentsData();

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All agent dashboard data."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch agent data.");
    }
  }


  @Get("plans")
  async planUsage(@Res() res: Response) {
    try {
      const dashboard = await this.dashboardService.planUsage();

      let result = JSON.stringify(dashboard, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Dashboard plan usage limit."));
      return res.status(HttpStatus.OK).json({ data: resData });
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
