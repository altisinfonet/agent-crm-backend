import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Res, BadRequestException, UploadedFile, UseInterceptors, Req, UploadedFiles } from '@nestjs/common';
import { UserService } from './user.service';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CommonDto } from 'src/auth/dto/common.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ImageUploadService } from '@/common/services/image-upload.service';
import { ApiResponse } from '@/common/helper/response.helper';
import { buildUserRootFolder, decryptData, encryptData } from '@/common/helper/common.helper';
import { Account } from '@/common/enum/account.enum';
import { AccountStatus } from '@/common/decorators/status.decorator';
import { AccountStatusGuard } from '@/common/guards/status.guard';

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
      throw new BadRequestException(error.response);
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
      throw new BadRequestException(error.response);
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
        panNumber ?? "admin"
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
      throw new BadRequestException(error.message);
    }
  }


  @UseGuards(JwtAuthGuard, AccountStatusGuard)
  @AccountStatus(Account.ACTIVE)
  @Post("kyc")
  @UseInterceptors(AnyFilesInterceptor())
  async submitKyc(
    @GetCurrentUserId() userId: bigint,
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

      if (kycData?.pan_image) {
        const { key } = await ImageUploadService.uploadBase64ImageToR2(
          kycData.pan_image,
          rootFolder,
          "pan"
        );
        uploads.pan_image = key;
      }

      if (kycData?.aadhar_image) {
        const { key } = await ImageUploadService.uploadBase64ImageToR2(
          kycData.aadhar_image,
          rootFolder,
          "aadhar"
        );
        uploads.aadhar_image = key;
      }

      if (kycData?.qr_code) {
        const { key } = await ImageUploadService.uploadBase64ImageToR2(
          kycData.qr_code,
          rootFolder,
          "qr"
        );
        uploads.qr_code = key;
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
