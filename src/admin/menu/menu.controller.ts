import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { MenuService } from './menu.service';
import type { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { ApiResponse } from 'src/helper/response.helper';
import { encryptData } from 'src/helper/common.helper';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MenuController {
  constructor(private readonly menuService: MenuService, private prisma: PrismaService) { }

  @Post()
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

  @Get("list")
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

  @Post("type")
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

  @Put("type/list")
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
