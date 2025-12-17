import { Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException, Controller, Put } from '@nestjs/common';
import { ApiResponse } from 'src/helper/response.helper';
import { PagesService } from './pages.service';
import type { Response } from 'express';
import { CommonDto } from 'src/auth/dto/common.dto';
import { encryptData } from 'src/helper/common.helper';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';


@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PagesController {
  constructor(private readonly dynamicPagesService: PagesService,) { }


  @Post()
  async create(@Res() res: Response, @Req() req: Request, @Body() createDynamicPageDto: CommonDto) {
    try {
      const page = await this.dynamicPagesService.create(createDynamicPageDto);

      let result = JSON.stringify(page, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Page added successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };


  @Put("list")
  async getAllDynamicPages(@Res() res: Response, @Body() dto: CommonDto) {
    try {
      const dynamicPages = await this.dynamicPagesService.getAllDynamicPages(dto);

      let result = JSON.stringify(dynamicPages, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All Pages"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };


  @Get(':slug')
  async getDynamicPage(@Res() res: Response, @Param('slug') id: string) {
    try {
      const dynamicPage = await this.dynamicPagesService.getDynamicPage(id);

      let result = JSON.stringify(dynamicPage, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Page found successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };

  @Patch(':id')
  async updateDynamicPage(@Res() res: Response, @Param('id') id: string, @Body() updateDynamicPageDto: CommonDto) {
    try {
      const dynamicPage = await this.dynamicPagesService.updateDynamicPage(BigInt(id), updateDynamicPageDto);

      let result = JSON.stringify(dynamicPage, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Page updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };


  @Delete(':id')
  async removeDynamicPage(@Res() res: Response, @Param('id') id: string) {
    try {
      const dynamicPage = await this.dynamicPagesService.removeDynamicPage(BigInt(id));

      let result = JSON.stringify(dynamicPage, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Page deleted successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };
}
