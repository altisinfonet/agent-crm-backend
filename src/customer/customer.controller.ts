import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res, UseGuards, Put } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { encryptData } from '@/common/helper/common.helper';
import { ApiResponse } from '@/common/helper/response.helper';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { AccountStatus } from '@/common/decorators/status.decorator';
import { AccountStatusGuard } from '@/common/guards/status.guard';
import { Account } from '@/common/enum/account.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('Agent - Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@AccountStatus(Account.ACTIVE)
@Controller({ path: 'customer', version: '1' })
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Customer created successfully' })
  async create(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Body() createCustomerDto: CommonDto) {
    try {
      const customer = await this.customerService.create(userId, createCustomerDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Customer created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer details' })
  @ApiParam({ name: 'id', description: 'Customer ID', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Customer details updated successfully' })
  async updateCustomer(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') customer_id: string, @Body() updateCustomerDto: CommonDto) {
    try {
      const customer = await this.customerService.updateCustomer(userId, BigInt(customer_id), updateCustomerDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Customer details updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }


  @Post('sale/:id')
  @ApiOperation({ summary: 'Sell product to a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Product sold successfully' })
  async sellProduct(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') customer_id: string, @Body() sellProductDto: CommonDto) {
    try {
      const customer = await this.customerService.sellProduct(userId, BigInt(customer_id), sellProductDto);
      let result = JSON.stringify(customer, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Product sell to customer."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
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
      throw new BadRequestException(error.response);
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
      throw new BadRequestException(error.response);
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
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Customer deleted successfully' })
  remove(@Param('id') id: string) {
    return this.customerService.remove(+id);
  }
}
