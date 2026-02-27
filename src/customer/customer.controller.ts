import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res, UseGuards, Put, UseInterceptors, UploadedFile, UploadedFiles, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { decryptData, encryptData } from '@/common/helper/common.helper';
import { ApiResponse } from '@/common/helper/response.helper';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { AccountStatus } from '@/common/decorators/status.decorator';
import { AccountStatusGuard } from '@/common/guards/status.guard';
import { Account } from '@/common/enum/account.enum';
import * as multer from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { documentFileFilter, imageFileFilter, upload } from '@/common/config/multer.config';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { SubscriptionGuard } from '@/common/guards/subscription.guard';

@ApiTags('Agent - Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AccountStatusGuard, SubscriptionGuard)
@AccountStatus(Account.ACTIVE)
@Controller({ path: 'customer', version: '1' })
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Customer created successfully' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "image", maxCount: 1 },
        { name: "pan_image", maxCount: 1 },
        { name: "aadhar_front", maxCount: 1 },
        { name: "aadhar_back", maxCount: 1 },
      ],
      upload
    )
  )
  async create(@Res() res: Response, @GetCurrentUserId() userId: bigint,
    @Body() createCustomerDto: CommonDto, @UploadedFiles() files: any,) {
    try {
      const customer = await this.customerService.create(userId, files, createCustomerDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Customer created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to create customer.");
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  @ApiParam({ name: 'id', description: 'Customer ID', example: 1 })
  @ApiBody({ type: CommonDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "image", maxCount: 1 },
        { name: "pan_image", maxCount: 1 },
        { name: "aadhar_front", maxCount: 1 },
        { name: "aadhar_back", maxCount: 1 },
      ],
      upload
    )
  )
  @SwaggerApiResponse({ status: 200, description: 'Customer details updated successfully' })
  async updateCustomer(@Res() res: Response, @GetCurrentUserId() userId: bigint,
    @Param('id') customer_id: string, @Body() updateCustomerDto: CommonDto, @UploadedFiles() files: any) {
    try {
      const customer = await this.customerService.updateCustomer(userId, BigInt(customer_id), files, updateCustomerDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Customer details updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update customer details.");
    }
  }


  @Post('sale/:id')
  @ApiOperation({ summary: 'Sell product to a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Product sold successfully' })
  async sellProduct(
    @Res() res: Response, @GetCurrentUserId() userId: bigint, @Query('slug') slug: string,
    @Param('id') customer_id: string, @Body() sellProductDto: CommonDto) {
    try {
      const customer = await this.customerService.sellProduct(userId, BigInt(customer_id), slug, sellProductDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Product sell to customer."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log("Error", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to sell product to customer.");
    }
  }

  @Put('list')
  @ApiOperation({ summary: 'Get all customers for logged-in agent' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Customer list fetched successfully' })
  async findAll(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Body() commonDto: CommonDto) {
    try {
      const customer = await this.customerService.findAll(userId, commonDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All customer lists."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch customer list.");
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Customer fetched successfully' })
  async findOne(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string) {
    try {
      const customer = await this.customerService.findOne(userId, BigInt(id));
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Customer."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch customer details.");
    }
  }

  @Patch('sale/:id')
  @ApiOperation({ summary: 'Update sold product details' })
  @ApiParam({ name: 'id', description: 'Sale ID', example: 10 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Sale updated successfully' })
  async updateSellProduct(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') sell_id: string, @Body() sellProductDto: CommonDto) {
    try {
      const customer = await this.customerService.updateSale(userId, BigInt(sell_id), sellProductDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Sell product updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update customer details.");
    }
  }

  // @Post('sale/upload/:id')
  // @ApiOperation({ summary: 'Document uploaded' })
  // @ApiParam({ name: 'id', description: 'Sale ID', example: 10 })
  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: "documents", maxCount: 10 }
  //     ],
  //     upload
  //   )
  // )

  @Post('sale/upload/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'documents', maxCount: 10 },
      ],
      {
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (file.fieldname === 'images') {
            return imageFileFilter(req, file, cb);
          }
          if (file.fieldname === 'documents') {
            return documentFileFilter(req, file, cb);
          }
          cb(new BadRequestException('Invalid upload field'), false);
        },
      }
    )
  )
  async uploadDocument(
    @Res() res: Response,
    @GetCurrentUserId() userId: bigint,
    @Param('id') sale_id: string,
    @UploadedFiles() files: {
      images?: any[];
      documents?: any[];
    }
  ) {
    try {
      // const customer = await this.customerService.uploadDocumentOld(userId, BigInt(sale_id), files);
      const sale = await this.customerService.uploadDocumentNew(userId, BigInt(sale_id), files);
      let result = JSON.stringify(sale, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Document uploaded"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log("Error", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to upload documents");
    }
  }


  @Delete('sale/:id')
  @ApiOperation({ summary: 'Sale deleted successfully' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Sale deleted successfully' })
  async removeSale(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') sale_id: string) {
    try {
      const sale = await this.customerService.removeSale(userId, BigInt(sale_id));
      let result = JSON.stringify(sale, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Sale deleted"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to delete sale");
    }
  }


  @Delete('sale/docs/:id')
  @ApiOperation({ summary: 'Delete docs file' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Delete docs file successfully' })
  async remove(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') docs_id: string) {
    try {
      const sale = await this.customerService.removeFile(userId, BigInt(docs_id));
      let result = JSON.stringify(sale, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Document deleted"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to delete documents");
    }
  }
}
