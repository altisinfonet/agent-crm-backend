import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, HttpStatus, BadRequestException, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request, Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
import { File as MulterFile } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { isValidImageBuffer, upload } from '@/common/config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';
import { R2Service } from '@/common/helper/r2.helper';
import { extname, basename } from 'path';

@ApiTags('Admin - Products')
@ApiBearerAuth('access-token')
@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  async sanitizeFileName(filename: string) {
    const name = basename(filename, extname(filename))
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .toLowerCase();

    return `${name}${extname(filename).toLowerCase()}`;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product (Admin)' })
  @SwaggerApiResponse({ status: 200, description: 'Update products' })
  @UseInterceptors(FileInterceptor('image', upload))
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateProductDto: CommonDto,
    @UploadedFile() file: MulterFile,
  ) {
    try {
      if (!file?.buffer) {
        throw new BadRequestException('Image file is required');
      }

      const isValid = await isValidImageBuffer(file.buffer);
      if (!isValid) {
        throw new BadRequestException('Invalid image file');
      }

      const existingProduct = await this.productsService.findById(BigInt(id));
      const oldImageKey = existingProduct?.image;

      const sanitizedFileName = await this.sanitizeFileName(file.originalname);
      const newKey = `products/product_${id}/${sanitizedFileName}`;

      await R2Service.upload(file.buffer, newKey, file.mimetype);

      const products = await this.productsService.updateProducts(
        BigInt(id),
        updateProductDto,
        { key: newKey },
      );

      if (oldImageKey && oldImageKey !== newKey) {
        await R2Service.remove(oldImageKey);
      }

      const result = JSON.stringify(products, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(
        new ApiResponse(JSON.parse(result), 'Product updated successfully'),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error?.response || error?.message);
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'Get all products (Admin)' })
  @SwaggerApiResponse({ status: 200, description: 'Fetched all products' })
  async findAllProducts(@Res() res: Response) {
    try {
      const products = await this.productsService.findAllProducts();

      let result = JSON.stringify(products, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Fetched all products."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }


  @Post(':id/entity')
  @ApiOperation({ summary: 'Create product entity (Admin)' })
  @ApiParam({ name: 'id', example: 1, description: 'Product ID' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Product entity created successfully', })
  @UseInterceptors(FileInterceptor('image', upload))
  async create(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() createEntityDto: CommonDto,
    @UploadedFile() file?: MulterFile,
  ) {
    try {
      let imageKey: string | null = null;
      if (file?.buffer) {
        const isValid = await isValidImageBuffer(file.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid image file');
        }

        const sanitizedFileName = await this.sanitizeFileName(file.originalname);
        imageKey = `entities/entity_${id}/${sanitizedFileName}`;

        await R2Service.upload(file.buffer, imageKey, file.mimetype);
      }

      const entity = await this.productsService.create(
        BigInt(id),
        createEntityDto,
        imageKey ? { image: imageKey } : undefined,
      );

      const result = JSON.stringify(entity, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse(JSON.parse(result), 'Product entity added successfully'));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error?.response || error?.message);
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
      throw new BadRequestException(error.response);
    }
  }

  @Patch('entity/:id')
  @ApiOperation({ summary: 'Update product entity (Admin)' })
  @ApiParam({ name: 'id', example: 10, description: 'Product entity ID' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Product entity updated successfully', })
  @UseInterceptors(FileInterceptor('image', upload))
  async updateEntity(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateEntityDto: CommonDto,
    @UploadedFile() file?: MulterFile,
  ) {
    try {
      const existingEntity = await this.productsService.findEntityById(
        BigInt(id),
      );

      if (!existingEntity) {
        throw new BadRequestException('Product entity not found');
      }

      const oldImageKey = existingEntity.image;
      let newImageKey: string | undefined;

      if (file?.buffer) {
        const isValid = await isValidImageBuffer(file.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid image file');
        }
        const sanitizedFileName = await this.sanitizeFileName(file.originalname);
        newImageKey = `entities/entity_${id}/${sanitizedFileName}`;
        await R2Service.upload(file.buffer, newImageKey, file.mimetype);
      }

      const entity = await this.productsService.updateEntity(
        BigInt(id),
        updateEntityDto,
        newImageKey ? { image: newImageKey } : undefined,
      );

      if (newImageKey && oldImageKey && oldImageKey !== newImageKey) {
        await R2Service.remove(oldImageKey);
      }

      const result = JSON.stringify(entity, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(
        new ApiResponse(
          JSON.parse(result),
          'Product entity updated successfully',
        ),
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error?.response || error?.message);
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
      throw new BadRequestException(error.response);
    }

  }
}
