import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, BadRequestException, Res, Req, Put, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import type { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/helper/response.helper';
import { CommonDto } from 'src/auth/dto/common.dto';
import { encryptData } from 'src/helper/common.helper';
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
    private prisma: PrismaService
  ) { }

  //////////////// Client side FAQs //////////////////
  @Get('client')
  async clientFaq(@Res() res: Response) {
    try {
      const faq = await this.faqService.clientFaq();
      let result = JSON.stringify(faq, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Faqs."));
    } catch (error: any) {
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }

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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
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
      console.log('error: ', error);
      throw new BadRequestException(error.response);
    }
  }
}
