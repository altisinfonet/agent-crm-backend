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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin - Products')
@ApiBearerAuth('access-token')
@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get('list')
  @ApiOperation({ summary: 'Get all products (Admin)' })
  @SwaggerApiResponse({ status: 200, description: 'Fetched all products' })
  async findAllProducts(@Res() res: Response) {
    try {
      const entity = await this.productsService.findAllProducts();

      let result = JSON.stringify(entity, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Fetched all products."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }


  @Post(':id/entity')
  @ApiOperation({ summary: 'Create product entity (Admin)' })
  @ApiParam({ name: 'id', example: 1, description: 'Product ID' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Product entity created successfully' })
  async create(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() createEntityDto: CommonDto,
  ) {
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

  @Put(':id/entity/list')
  @ApiOperation({ summary: 'Get product entity list (Admin)' })
  @ApiParam({ name: 'id', example: 1, description: 'Product ID' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Product entity list fetched' })
  async findAll(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() findEntityDto: CommonDto,
  ) {
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
  @ApiOperation({ summary: 'Update product entity (Admin)' })
  @ApiParam({ name: 'id', example: 10, description: 'Product entity ID' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Product entity updated successfully' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateEntityDto: CommonDto,
  ) {
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
  @ApiOperation({ summary: 'Delete product entity (Admin)' })
  @ApiParam({ name: 'id', example: 10, description: 'Product entity ID' })
  @SwaggerApiResponse({ status: 200, description: 'Product entity deleted successfully' })
  async remove(
    @Res() res: Response,
    @Param('id') id: string,
  ) {
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
