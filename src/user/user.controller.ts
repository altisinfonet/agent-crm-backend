import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus, Res, BadRequestException, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { encryptData } from 'src/helper/common.helper';
import { ApiResponse } from 'src/helper/response.helper';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CommonDto } from 'src/auth/dto/common.dto';
import { isValidImage, upload } from 'src/common/config/multer.config';
import { FileInterceptor } from '@nestjs/platform-express';
import { File as MulterFile } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

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
  @Patch('profile-pic')
  @UseInterceptors(FileInterceptor('image', upload))
  async editUser(
    @Req() req: Request,
    @GetCurrentUserId() userId: bigint,
    @Res() res: Response,
    @UploadedFile() file: MulterFile) {
    try {
      let targetPath = ""
      if (file?.path) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const isValid = await isValidImage(file.path);

        if (!isValid) {
          throw new BadRequestException(
            new ApiResponse(null, `Invalid image file: ${file?.originalname}`, false)
          );
        }

        const targetDir = path.join(process.env.IMAGE_PATH!, process.env.USER_PROFILE_IMAGE_PATH!, userId.toString());
        targetPath = path.join(targetDir, file?.filename);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        } else {
          const files = fs.readdirSync(targetDir);
          for (const f of files) {
            if (f !== file?.filename) {
              const filePath = path.join(targetDir, f);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
        fs.renameSync(file.path, targetPath);
      }

      const user = await this.userService.updateProfileImage(userId, req?.body, {
        filename: file?.filename,
        path: `${process.env.BASE_PATH}/${targetPath}`,
      });

      let result = JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      );
      const resData = encryptData(new ApiResponse((JSON.parse(result)), "Profile updated successfully."));
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
