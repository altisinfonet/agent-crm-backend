import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Res, BadRequestException, UploadedFile, UseInterceptors, Req, UploadedFiles } from '@nestjs/common';
import { UserService } from './user.service';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CommonDto } from 'src/auth/dto/common.dto';
import { isValidImageBuffer, upload } from 'src/common/config/multer.config';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import { ApiResponse } from '@/common/helper/response.helper';
import { buildUserRootFolder, decryptData, encryptData } from '@/common/helper/common.helper';
import { R2Service } from '@/common/helper/r2.helper';

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(@Body() createUserDto: CommonDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(
    @GetCurrentUserId() userId: bigint,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const userData = await this.userService.getCurrentUser(userId);
      let result = JSON.stringify(userData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Fetched user data"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }


  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateUserProfile(
    @GetCurrentUserId() userId: bigint,
    @Body() dto: CommonDto,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const userData = await this.userService.updateUserProfile(userId, dto);
      let result = JSON.stringify(userData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "User profile updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile-pic")
  @UseInterceptors(FileInterceptor("image", upload))
  async editUser(
    @GetCurrentUserId() userId: bigint,
    @UploadedFile() file: MulterFile,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      if (!file?.buffer) {
        throw new BadRequestException("Image file is required");
      }

      const isValid = await isValidImageBuffer(file.buffer);
      if (!isValid) {
        throw new BadRequestException("Invalid image file");
      }

      // 🔹 Fetch user basic info
      const findUser = await this.userService.getUserForUpload(userId);
      if (!findUser?.agentKYC?.pan_number) {
        throw new BadRequestException("PAN not found. Complete KYC first.");
      }

      const rootFolder = buildUserRootFolder(
        `${findUser.first_name} ${findUser.last_name}`,
        findUser.agentKYC?.pan_number
      );

      const ext = file.mimetype.split("/")[1];
      const key = `${rootFolder}/profile.${ext}`;

      await R2Service.upload(file.buffer, key, file.mimetype);

      const user = await this.userService.updateProfileImage(userId, req.body, { key: key });


      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "User profile updated successfully."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


  @UseGuards(JwtAuthGuard)
  @Post("kyc")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "pan_image", maxCount: 1 },
        { name: "aadhar_image", maxCount: 1 },
        { name: "qr_code", maxCount: 1 },
      ],
      upload
    )
  )
  async submitKyc(
    @GetCurrentUserId() userId: bigint,
    @UploadedFiles() files: any,
    @Body() kycDto: CommonDto,
    @Res() res: Response
  ) {
    try {
      const uploads: any = {};
      const kycData = decryptData(kycDto.data);

      const rootFolder = buildUserRootFolder(
        kycData.username,
        kycData.pan_number
      );

      if (files.pan_image?.[0]) {
        const ext = files.pan_image[0].mimetype.split("/")[1];
        uploads.pan_image = `${rootFolder}/pan.${ext}`;

        await R2Service.upload(
          files.pan_image[0].buffer,
          uploads.pan_image,
          files.pan_image[0].mimetype
        );
      }

      if (files.aadhar_image?.[0]) {
        const ext = files.aadhar_image[0].mimetype.split("/")[1];
        uploads.aadhar_image = `${rootFolder}/aadhar.${ext}`;

        await R2Service.upload(
          files.aadhar_image[0].buffer,
          uploads.aadhar_image,
          files.aadhar_image[0].mimetype
        );
      }

      if (files.qr_code?.[0]) {
        const ext = files.qr_code[0].mimetype.split("/")[1];
        uploads.qr_code = `${rootFolder}/qr.${ext}`;

        await R2Service.upload(
          files.qr_code[0].buffer,
          uploads.qr_code,
          files.qr_code[0].mimetype
        );
      }

      const saved = await this.userService.saveKyc(userId, kycData, uploads);

      return res.status(HttpStatus.OK).json({
        data: encryptData(
          new ApiResponse(saved, "KYC details updated successfully")
        ),
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("kyc")
  async getAgentKYCDetails(
    @GetCurrentUserId() userId: bigint,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const userData = await this.userService.getAgentKYCDetails(userId);
      let result = JSON.stringify(userData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Fetched agent KYC details."));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      throw new BadRequestException(error.response);
    }
  }


  @Get('faq/list')
  async clientFaq(@Res() res: Response) {
    try {
      const faq = await this.userService.clientFaq();
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
