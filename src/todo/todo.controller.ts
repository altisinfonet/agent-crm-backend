import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CommonDto } from '@/auth/dto/common.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { ApiResponse } from '@/helper/response.helper';
import { encryptData } from '@/helper/common.helper';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'todo', version: '1' })
export class TodoController {
  constructor(private readonly todoService: TodoService) { }

  @Post()
  async create(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Body() createTodoDto: CommonDto) {
    try {
      const todo = await this.todoService.create(userId, createTodoDto);
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Put("list")
  async findAll(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Body() fetchTodoDto: CommonDto) {
    try {
      const todo = await this.todoService.findAll(userId, fetchTodoDto);
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo list."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  async findOne(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string) {
    try {
      const todo = await this.todoService.findOne(userId, BigInt(id));
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo list."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  async update(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string, @Body() updateTodoDto: CommonDto) {
    try {
      const todo = await this.todoService.update(userId, BigInt(id), updateTodoDto);
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string) {
    try {
      const todo = await this.todoService.remove(userId, BigInt(id));
      let result = JSON.stringify(todo, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Todo deleted successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }
}
