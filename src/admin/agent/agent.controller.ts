import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, HttpStatus, BadRequestException, Put } from '@nestjs/common';
import { AgentService } from './agent.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import type { Request, Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('Admin - Agents')
@ApiBearerAuth('access-token')
@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

  @Put("list")
  @ApiOperation({ summary: 'Get list of agents (Admin)' })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Agents fetched successfully' })
  async findAll(@Res() res: Response, @Body() getAgentDto: CommonDto) {
    try {
      const agent = await this.agentService.findAll(getAgentDto);
      let result = JSON.stringify(agent, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agents fetched successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log("Error fetching agent list:", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch agents list.");
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent details by ID (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Agent details fetched successfully' })
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const agent = await this.agentService.findOne(BigInt(id));
      let result = JSON.stringify(agent, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agent details fetched successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log("Error fetching agent details:", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch agent details.");
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agent details (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: CommonDto })
  @SwaggerApiResponse({ status: 200, description: 'Agent details updated successfully' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateAgentDto: CommonDto,
  ) {
    try {
      const agent = await this.agentService.update(BigInt(id), updateAgentDto);
      let result = JSON.stringify(agent, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agent details updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log("Error updating agent details:", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update agent details.");
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent (Admin)' })
  @ApiParam({ name: 'id', example: 1 })
  @SwaggerApiResponse({ status: 200, description: 'Agent deleted successfully' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    try {
      const agent = await this.agentService.remove(BigInt(id));
      let result = JSON.stringify(agent, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agent details deleted successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      console.log("Error deleting agent details:", error);
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to delete agent details.");
    }
  }
}
