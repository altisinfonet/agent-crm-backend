import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res, UseGuards, Put } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { encryptData } from '@/helper/common.helper';
import { ApiResponse } from '@/helper/response.helper';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'customer', version: '1' })
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @Post()
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

  @Post("sale/:id")
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

  @Put("list")
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

  @Patch("sale/:id")
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
  remove(@Param('id') id: string) {
    return this.customerService.remove(+id);
  }
}
