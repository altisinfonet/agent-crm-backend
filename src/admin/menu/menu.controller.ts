import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { MenuService } from './menu.service';
import type { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';


@ApiTags('Admin - Menus')
@ApiBearerAuth('access-token')
@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MenuController {
  constructor(private readonly menuService: MenuService, private prisma: PrismaService) { }

  @Post()
  @ApiOperation({ summary: 'Create menu (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Menu created successfully' })
  async create(@Res() res: Response, @Body() createMenuDto: CommonDto,
    @Req() req: Request) {
    try {
      const menu = await this.menuService.create(createMenuDto);

      let result = JSON.stringify(menu, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Menu created successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all menus (Admin)' })
  @SwaggerApiResponse({ status: 200, description: 'All menus fetched successfully' })
  async findAll(@Res() res: Response) {
    try {
      const menuType = await this.menuService.findAll();
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All Menus"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update menu (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Menu updated successfully' })
  async update(@Res() res: Response, @Body() updateMenuDto: CommonDto,
    @Req() req: Request, @Param('id') id: string,) {
    try {
      const menu_id = id === "undefined" ? undefined : BigInt(id);
      const menu = await this.menuService.update(updateMenuDto, menu_id);

      let result = JSON.stringify(menu, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Menu updated successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      console.log("error", error);
      throw new BadRequestException(error.response);
    }
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Menu deleted successfully' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const menuType = await this.menuService.remove(BigInt(id),);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Menu deleted successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  ///////////////////////////////////////////////////////

  @Post('type')
  @ApiOperation({ summary: 'Create menu type (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Menu type created successfully' })
  async createMenuType(@Res() res: Response, @Body() createMenuTypeDto: CommonDto,
    @Req() req: Request,) {
    try {
      const menuTypes = await this.menuService.createMenuType(createMenuTypeDto);

      let result = JSON.stringify(menuTypes, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Menu Type created successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Put('type/list')
  @ApiOperation({ summary: 'Get list of menu types (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'All menu types fetched successfully' })
  async findAllMenuType(@Res() res: Response, @Body() getAllMenuTypeDto: CommonDto) {
    try {
      const menuType = await this.menuService.findAllMenuType(getAllMenuTypeDto);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All menu types"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Get('type/:slug')
  @ApiOperation({ summary: 'Get menu type by slug (Admin)' })
  @ApiParam({ name: 'slug', example: 'footer-menu' })
  @SwaggerApiResponse({ status: 200, description: 'Menu type fetched successfully' })
  async findOneMenuTypeBySlug(@Res() res: Response, @Param('slug') menu_type: string) {
    try {
      const menuType = await this.menuService.findOneMenuType(menu_type);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Menu type"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch('type/:id')
  @ApiOperation({ summary: 'Update menu type (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Menu type updated successfully' })
  async updateType(@Res() res: Response, @Param('id') id: string, @Body() updateMenuTypeDto: CommonDto) {
    try {
      const menuType = await this.menuService.updateType(BigInt(id), updateMenuTypeDto);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Menu Type updated successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete('type/:id')
  @ApiOperation({ summary: 'Delete menu type (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Menu type deleted successfully' })
  async removeType(@Res() res: Response, @Param('id') id: string) {
    try {
      const menuType = await this.menuService.removeType(BigInt(id),);
      let result = JSON.stringify(menuType, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Menu Type deleted successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
