import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Res, BadRequestException, UseGuards, Put } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { encryptData } from 'src/helper/common.helper';
import { ApiResponse } from 'src/helper/response.helper';
import type { Response } from 'express';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('Agent - Meetings')
@ApiBearerAuth('access-token')
@Controller({ path: 'meeting', version: '1' })
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Meeting created successfully' })
  async create(@Res() res: Response, @Body() createMeetingDto: CommonDto, @GetCurrentUserId() userId: bigint) {
    try {
      const meeting = await this.meetingService.create(userId, createMeetingDto);
      let result = JSON.stringify(meeting, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Meeting created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Put('list')
  @ApiOperation({ summary: 'Get all meetings for logged-in agent' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Meeting list fetched successfully' })
  async findAll(@Res() res: Response, @Body() getMeetingDto: CommonDto, @GetCurrentUserId() userId: bigint) {
    try {
      const meeting = await this.meetingService.findAll(userId, getMeetingDto);
      let result = JSON.stringify(meeting, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All meeting lists."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting details by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Meeting fetched successfully' })
  async findOne(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string) {
    try {
      const meeting = await this.meetingService.findOne(userId, BigInt(id));
      let result = JSON.stringify(meeting, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Meeting."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update meeting details' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Meeting updated successfully' })
  async update(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string, @Body() updateMeetingDto: CommonDto) {
    try {
      const meeting = await this.meetingService.update(userId, BigInt(id), updateMeetingDto);
      let result = JSON.stringify(meeting, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Meeting updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete meeting by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Meeting deleted successfully' })
  async remove(@Res() res: Response, @GetCurrentUserId() userId: bigint, @Param('id') id: string,) {
    try {
      const meeting = await this.meetingService.remove(userId, BigInt(id));
      let result = JSON.stringify(meeting, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Meeting deleted successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }
}
