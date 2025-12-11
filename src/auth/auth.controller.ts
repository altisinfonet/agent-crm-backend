import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';


@ApiTags('Authentication')
@Controller('api/v1')
export class AuthController {
    constructor(private authService: AuthService) { }

    @ApiOperation({ summary: 'Send OTP for login' })
    @ApiBody({ type: SendOtpDto })
    @Post('send-otp')
    async sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto);
    }

    @ApiOperation({ summary: 'Login using password, OTP, Google, or Apple' })
    @ApiBody({ type: LoginDto })
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }


    @ApiOperation({ summary: 'Refresh access token' })
    @ApiBody({ type: RefreshTokenDto })
    @Post('refresh')
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refresh_token);
    }
}
