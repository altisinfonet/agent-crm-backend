import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request, Response } from 'express';
import { ApiResponse } from 'src/helper/response.helper';
import { encryptData } from 'src/helper/common.helper';


@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post(":id/entity")
  async create(@Res() res: Response, @Param('id') id: string, @Body() createEntityDto: CommonDto) {
    try {
      const entity = await this.productsService.create(BigInt(id), createEntityDto);

      let result = JSON.stringify(entity, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Product enetity added successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  };

  @Put(":id/entity/list")
  async findAll(@Res() res: Response, @Param('id') id: string, @Body() findEntityDto: CommonDto) {
    try {
      const entity = await this.productsService.findAll(BigInt(id), findEntityDto);

      let result = JSON.stringify(entity, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Product enetity list"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch('entity/:id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() updateEntityDto: CommonDto) {
    try {
      const entity = await this.productsService.update(BigInt(id), updateEntityDto);

      let result = JSON.stringify(entity, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Product enetity updated successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Delete('entity/:id')
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const entity = await this.productsService.remove(BigInt(id));

      let result = JSON.stringify(entity, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Product enetity deleted successfully"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }

  }
}
