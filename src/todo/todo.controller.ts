import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
import type { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { AccountStatusGuard } from '@/common/guards/status.guard';
import { Account } from '@/common/enum/account.enum';
import { AccountStatus } from '@/common/decorators/status.decorator';
import { SubscriptionGuard } from '@/common/guards/subscription.guard';

@ApiTags('Agent - Todos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, AccountStatusGuard, SubscriptionGuard)
@AccountStatus(Account.ACTIVE)
@Controller({ path: 'todo', version: '1' })
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Todo created successfully' })
  async create(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Body() createTodoDto: CommonDto) {
    try {
      const todo = await this.todoService.create(userId, createTodoDto);
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read notifications.");
    }
  }

  @Put('list')
  @ApiOperation({ summary: 'Get todo list for logged-in user' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Todo list fetched successfully' })
  async findAll(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Body() fetchTodoDto: CommonDto) {
    try {
      const todo = await this.todoService.findAll(userId, fetchTodoDto);
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo list."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log("error", error);

      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read todo list.");
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get todo details by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Todo fetched successfully' })
  async findOne(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string) {
    try {
      const todo = await this.todoService.findOne(userId, BigInt(id));
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo list."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read todo details.");
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update todo (including mark as complete)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Todo updated successfully' })
  async update(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string, @Body() updateTodoDto: CommonDto) {
    try {
      const todo = await this.todoService.update(userId, BigInt(id), updateTodoDto);
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update todo.");
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete todo by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Todo deleted successfully' })
  async remove(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string) {
    try {
      const todo = await this.todoService.remove(userId, BigInt(id));
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo deleted successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to delete todo.");
    }
  }
}
