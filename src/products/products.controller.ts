import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, Put, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import type { Response } from 'express';
import { encryptData } from 'src/helper/common.helper';
import { ApiResponse } from 'src/helper/response.helper';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';


@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get("list")
  async findAll(@Res() res: Response) {
    try {
      const products = await this.productsService.findAll();
      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Fetched all products."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Put(":id/entity/list")
  async findOne(@Res() res: Response, @Param('id') id: string, @Body() findEntityDto: CommonDto) {
    try {
      const entity = await this.productsService.findOne(BigInt(id), findEntityDto);

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

  @UseGuards(JwtAuthGuard)
  @Post("agent/entity/:id")
  async create(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string,) {
    try {
      const entity = await this.productsService.create(userId, BigInt(id));

      let result = JSON.stringify(entity, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agent product enetity created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: CommonDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
