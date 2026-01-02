import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ApiResponse } from 'src/helper/response.helper';
import { encryptData } from 'src/helper/common.helper';
import { CommonDto } from './dto/common.dto';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { GetCurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { AuthRateLimitGuard } from '@/common/guards/auth-rate-limit.guard';


@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private config: ConfigService,
    ) { }
    @ApiOperation({ summary: 'Login using password, OTP, Google, or Apple' })
    @UseGuards(AuthRateLimitGuard)
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() loginDto: CommonDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        try {
            const loginData = await this.authService.auth(loginDto, req);
            // this.setCookies(res, tokens);

            let result = JSON.stringify(loginData, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            const resData = encryptData(new ApiResponse((JSON.parse(result)), "Login successful."));
            return res.status(HttpStatus.OK).json({ data: resData });
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Body() dto: CommonDto, @Res({ passthrough: true }) res: Response) {
        try {
            const tokens = await this.authService.refreshTokens(dto.data);

            const resData = encryptData(
                new ApiResponse(tokens, 'Tokens refreshed successfully')
            );
            return res.status(HttpStatus.OK).json({ data: resData });
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('sid') sid: string,
        @Res({ passthrough: true }) res: Response) {
        try {
            const logout = await this.authService.logout(BigInt(userId), sid);
            const resData = (
                new ApiResponse(null, 'Logout successful.')
            );
            return res.status(HttpStatus.OK).json(resData);
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    @HttpCode(HttpStatus.OK)
    async logoutAll(
        @GetCurrentUserId() userId: string,
        @Res({ passthrough: true }) res: Response) {
        try {
            const logout = await this.authService.logoutAll(BigInt(userId));
            const resData = (
                new ApiResponse(null, 'Logout successful from all device.')
            );
            return res.status(HttpStatus.OK).json(resData);
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @Post('forgot-password')
    async forgotPassword(@Body() dto: CommonDto, @Req() req: Request, @Res() res: Response) {
        try {
            let result = await this.authService.forgotPassword(dto);
            if (result) {
                return res.status(HttpStatus.OK).json(new ApiResponse(null, "Password reset request accepted. Email will be sent if the user exists."));
            } else {
                throw new BadRequestException(new ApiResponse(null, 'User not found.', false));
            }
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @Post('reset-password')
    async resetPassword(@Body() dto: CommonDto, @Req() req: Request, @Res() res: Response) {
        try {
            let result = await this.authService.resetPassword(dto);
            if (result) {
                return res.status(HttpStatus.OK).json(new ApiResponse(null, "Your password has been reset successfully."));
            } else {
                throw new BadRequestException(new ApiResponse(null, 'Invalid or expired token', false));
            }
        } catch (error: any) {
            console.log('error: ', error);
            throw new BadRequestException(error.response);
        }
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('test-encryption')
    async TestEncryption(@Res() res: Response, @Body() body: any) {
        try {
            const test = await this.authService.TestEncryption(body);
            let result = JSON.stringify(test, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );

            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Encrypted data."));
        } catch (error) {
            throw new BadRequestException(error.response);
        }
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('test-decryption')
    async TestDecryption(@Res() res: Response, @Body() body: any) {
        try {
            const test = await this.authService.TestDecryption(body);
            let result = JSON.stringify(test, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );

            return res.status(HttpStatus.OK).json(new ApiResponse(JSON.parse(result), "Decrypted data."));
        } catch (error) {
            throw new BadRequestException(error.response);
        }
    }



}
