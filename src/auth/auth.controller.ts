import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { Request, Response } from 'express';
import { ApiResponse } from '@/common/helper/response.helper';
import { encryptData } from '@/common/helper/common.helper';
import { CommonDto } from './dto/common.dto';
import { GetCurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { GetCurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { AuthRateLimitGuard } from '@/common/guards/auth-rate-limit.guard';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiBearerAuth,
    ApiResponse as SwaggerApiResponse,
    ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AccountStatusGuard } from '@/common/guards/status.guard';
import { Account } from '@/common/enum/account.enum';
import { AccountStatus } from '@/common/decorators/status.decorator';


@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private config: ConfigService,
    ) { }

    @ApiOperation({ summary: 'Check user is exists or not using cherentials ' })
    @SwaggerApiResponse({ status: 200, description: 'User checked' })
    @Post('check')
    @HttpCode(HttpStatus.OK)
    async check(
        @Body() dto: CommonDto,
        @Res({ passthrough: true }) res: Response) {
        try {
            const check = await this.authService.checkUser(dto);

            let result = JSON.stringify(check, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            const resData = encryptData(new ApiResponse((JSON.parse(result)), "User checked."));
            return res.status(HttpStatus.OK).json({ data: resData });
        } catch (error: any) {
            if (error.status && error.response) {
                return res.status(error.status).json(error.response);
            }
            throw new BadRequestException("Failed to check user.");
        }
    }


    @ApiOperation({ summary: 'Login using password, OTP, Google, or Apple' })
    @ApiBody({ type: CommonDto })
    @SwaggerApiResponse({ status: 200, description: 'Login successful' })
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

            let result = JSON.stringify(loginData, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
            );
            const resData = encryptData(new ApiResponse((JSON.parse(result)), "Login successful."));
            return res.status(HttpStatus.OK).json({ data: resData });
        } catch (error: any) {
            console.log("error", error);
            if (error.status && error.response) {
                return res.status(error.status).json(error.response);
            }
            throw new BadRequestException("Failed to login user.");
        }
    }

    @ApiOperation({ summary: 'Refresh access and refresh tokens' })
    @ApiBody({ type: CommonDto })
    @SwaggerApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
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
            if (error.status && error.response) {
                return res.status(error.status).json(error.response);
            }
            throw new BadRequestException("Failed to refresh tokens.");
        }
    }

    @ApiOperation({ summary: 'Logout from current session' })
    @ApiBearerAuth('access-token')
    @SwaggerApiResponse({ status: 200, description: 'Logout successful' })
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
            if (error.status && error.response) {
                return res.status(error.status).json(error.response);
            }
            throw new BadRequestException("Failed to logout user.");
        }
    }

    @ApiOperation({ summary: 'Logout from all active sessions' })
    @ApiBearerAuth('access-token')
    @SwaggerApiResponse({ status: 200, description: 'Logged out from all devices' })
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
            if (error.status && error.response) {
                return res.status(error.status).json(error.response);
            }
            throw new BadRequestException("Failed to update subscription plan.");
        }
    }

    @ApiOperation({ summary: 'Request password reset via email' })
    @ApiBody({ type: CommonDto })
    @SwaggerApiResponse({ status: 200, description: 'Password reset request accepted' })
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: CommonDto, @Req() req: Request, @Res() res: Response) {
        try {
            let result = await this.authService.forgotPassword(dto);
            if (result) {
                return res.status(HttpStatus.OK).json(new ApiResponse(null, "Password reset request accepted. An email will be sent if the email exists."));
            } else {
                throw new BadRequestException(new ApiResponse(null, 'User not found.', false));
            }
        } catch (error: any) {
            if (error.status && error.response) {
                return res.status(error.status).json(error.response);
            }
            throw new BadRequestException("Failed to request password reset.");
        }
    }

    @ApiOperation({ summary: 'Reset password using reset token' })
    @ApiBody({ type: CommonDto })
    @SwaggerApiResponse({ status: 200, description: 'Password reset successful' })
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
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
    @ApiExcludeEndpoint()
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
            if (error.status && error.response) {
                return res.status(error.status).json(error.response);
            }
            throw new BadRequestException("Failed to encrypt data.");
        }
    }
    @ApiExcludeEndpoint()
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
            if (error.status && error.response) {
                return res.status(error.status).json(error.response);
            }
            throw new BadRequestException("Failed to decrypt data.");
        }
    }



}
