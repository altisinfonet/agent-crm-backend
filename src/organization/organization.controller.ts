import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, BadRequestException, UseGuards } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AccountStatusGuard } from '@/common/guards/status.guard';
import { Account } from '@/common/enum/account.enum';
import { AccountStatus } from '@/common/decorators/status.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { GetCurrentUserId } from '@/common/decorators/current-user-id.decorator';
import { encryptData } from '@/common/helper/common.helper';
import { ApiResponse } from '@/common/helper/response.helper';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard, AccountStatusGuard)
@AccountStatus(Account.ACTIVE)
@Controller({ path: '', version: '1' })
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) { }

    @Post()
    create(@Body() createOrganizationDto: CommonDto) {
        return this.organizationService.create(createOrganizationDto);
    }


    @Get('agent/organization')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Agent will get organizations inforamtions (Agent only)' })
    @SwaggerApiResponse({ status: 200, description: 'Agent organizations data fetched successfully' })
    async getOrganization(@Res() res: Response, @GetCurrentUserId() userId: bigint,) {
        try {
            const entity = await this.organizationService.findOne(userId);

            let result = JSON.stringify(entity, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );

            const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agent organizations data fetched successfully."));
            return res.status(HttpStatus.OK).json({ data: resData });
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @Patch('agent/organization/:id')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update organization`s inforamtion (Agent only)' })
    @SwaggerApiResponse({ status: 200, description: 'Agent organization`s inforamtion updated successfully' })
    async updateOrganization(@Res() res: Response, @Param('id') id: string, @GetCurrentUserId() userId: bigint, @Body() updateProductDto: CommonDto) {
        try {
            const entity = await this.organizationService.update(BigInt(id), userId, updateProductDto);

            let result = JSON.stringify(entity, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );

            const resData = encryptData(new ApiResponse((JSON.parse(result)), "Agent organization`s inforamtion updated successfully."));
            return res.status(HttpStatus.OK).json({ data: resData });
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.organizationService.remove(+id);
    }
}
