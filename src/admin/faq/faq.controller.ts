import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res, Req, Put, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import type { Request, Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { CommonDto } from 'src/auth/dto/common.dto';
import { encryptData } from '@/common/helper/common.helper';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';



@Controller({ path: '', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FaqController {
  constructor(
    private readonly faqService: FaqService,
  ) { }

  /////////////////FAQ Module////////////////////
  @Post("module")
  async createModule(@Res() res: Response, @Body() createFaqModuleDto: CommonDto,
    @Req() req: Request,

  ) {
    try {
      const faqModule = await this.faqService.createModule(createFaqModuleDto);
      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Faq category created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to create FAQ module.");
    }
  }

  @Put("module/list")
  async findAllModule(@Res() res: Response, @Body() dto: CommonDto) {
    try {
      const faqModule = await this.faqService.findAllModule(dto)
      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All Faq categories."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch FAQ modules.");
    }
  }

  @Get('module/:id')
  async findOneModule(@Res() res: Response, @Param('id') id: string) {
    try {
      const faqModule = await this.faqService.findOneModule(BigInt(id))
      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Faq category."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch FAQ module details.");
    }
  }

  @Patch('module/:id')
  async updateModule(@Res() res: Response, @Param('id') id: string, @Body() updateFaqModuleDto: CommonDto,
    @Req() req: Request,
  ) {
    try {
      const faqModule = await this.faqService.updateModule(BigInt(id), updateFaqModuleDto);
      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Faq category updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update FAQ module.");
    }
  }

  @Delete('module/:id')
  async removeModule(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request
  ) {
    try {
      const faqModule = await this.faqService.removeModule(BigInt(id));

      let result = JSON.stringify(faqModule, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Faq category deleted successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to delete FAQ module.");
    }
  }

  /////////////////FAQ////////////////////
  @Post()
  async create(@Res() res: Response, @Body() createFaqDto: CommonDto,
    @Req() req: Request,
  ) {
    try {
      const faq = await this.faqService.create(createFaqDto);
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Faq created successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to create FAQ.");
    }
  }

  @Put(":id/list")
  async findAll(@Res() res: Response, @Param('id') module_id: string, @Body() dto: CommonDto) {
    try {
      const faq = await this.faqService.findAll(BigInt(module_id), dto);
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "All Faqs."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch FAQ list.");
    }
  }

  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const faq = await this.faqService.findOne(BigInt(id));
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Faqs."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch FAQ.");
    }
  }

  @Patch(':id')
  async update(@Res() res: Response, @Param('id') id: string, @Body() updateFaqDto: CommonDto,
    @Req() req: Request,
  ) {
    try {
      const faq = await this.faqService.update(BigInt(id), updateFaqDto);
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Faqs updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update FAQ.");
    }
  }

  @Delete(':id')
  async remove(@Res() res: Response, @Param('id') id: string,
    @Req() req: Request) {
    try {
      const faq = await this.faqService.remove(BigInt(id));

      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );

      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Faqs deleted successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to delete FAQ.");
    }
  }
}
