import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Res, BadRequestException, UploadedFile, UseInterceptors, Req, UploadedFiles, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CommonDto } from 'src/auth/dto/common.dto';
import { AnyFilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ImageUploadService } from '@/common/services/image-upload.service';
import { ApiResponse } from '@/common/helper/response.helper';
import { buildUserRootFolder, decryptData, encryptData } from '@/common/helper/common.helper';
import { Account, Onboarding } from '@/common/enum/account.enum';
import { AccountStatus, OnboardingStatus } from '@/common/decorators/status.decorator';
import { AccountStatusGuard, OnboardingStatusGuard } from '@/common/guards/status.guard';
import { upload } from '@/common/config/multer.config';
import { R2Service } from '@/common/helper/r2.helper';

@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read user data.");
    }
  }


  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update user profile.");
    }
  }

  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Patch("profile-pic")
  @UseInterceptors(AnyFilesInterceptor())
  async editUser(
    @GetCurrentUserId() userId: bigint,
    @Body() commonDto: CommonDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const data = decryptData(commonDto.data);

      if (!data?.image) {
        throw new BadRequestException("Image is required");
      }

      const findUser = await this.userService.getUserForUpload(userId);
      const panNumber = findUser?.agentKYC?.pan_number;

      if (findUser?.role?.name === "AGENT" && !panNumber) {
        throw new BadRequestException("PAN not found. Complete KYC first.");
      }

      const rootFolder = buildUserRootFolder(
        `${findUser.first_name} ${findUser.last_name}`,
        panNumber ?? "admin",
        userId.toString()
      );

      const uploadResult = await ImageUploadService.uploadBase64ImageToR2(
        data.image,
        rootFolder,
        `profile_${userId}`
      );

      const user = await this.userService.updateProfileImage(userId, data?.delete, {
        key: uploadResult.key,
      });

      const result = JSON.stringify(user, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      );

      const resData = encryptData(
        new ApiResponse(JSON.parse(result), "User profile updated successfully.")
      );

      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to update user profile.");
    }
  }


  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Post("kyc")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "pan_image", maxCount: 1 },
        { name: "aadhar_front", maxCount: 1 },
        { name: "aadhar_back", maxCount: 1 },
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
        kycData.pan_number,
        userId.toString()
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

      if (files.aadhar_front?.[0]) {
        const ext = files.aadhar_front[0].mimetype.split("/")[1];
        uploads.aadhar_front = `${rootFolder}/aadhar_front.${ext}`;

        await R2Service.upload(
          files.aadhar_front[0].buffer,
          uploads.aadhar_front,
          files.aadhar_front[0].mimetype
        );
      }

      if (files.aadhar_back?.[0]) {
        const ext = files.aadhar_back[0].mimetype.split("/")[1];
        uploads.aadhar_back = `${rootFolder}/aadhar_back.${ext}`;

        await R2Service.upload(
          files.aadhar_back[0].buffer,
          uploads.aadhar_back,
          files.aadhar_back[0].mimetype
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

      const saved = await this.userService.saveKyc(userId, kycData, uploads, rootFolder);

      return res.status(HttpStatus.OK).json({
        data: encryptData(
          new ApiResponse(saved, "KYC details updated successfully")
        ),
      });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to submit KYC details.");
    }
  }

  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to fetch agent KYC details.");
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
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read FAQs.");
    }
  }

  @Get('country/list')
  async getCountries(
    @Res({ passthrough: true }) res: Response,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    try {
      const data = await this.userService.getCountryLists(page, limit, search);
      let result = JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Fetched country lists"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read country lists.");
    }
  }


  @Get('currency/list')
  async getCurrencies(
    @Res({ passthrough: true }) res: Response,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    try {
      const data = await this.userService.getCurrencyLists(page, limit, search);
      let result = JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Fetched currency lists"));
      return res.status(HttpStatus.OK).json({ data: resData });
    } catch (error: any) {
      if (error.status && error.response) {
        return res.status(error.status).json(error.response);
      }
      throw new BadRequestException("Failed to read currency lists.");
    }
  }

}
