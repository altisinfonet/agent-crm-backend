import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from './otp/otp.service';
import { SessionService } from './sessions/session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
    providers: [
        AuthService,
        OtpService,
        SessionService,
        JwtStrategy,
        RefreshStrategy,
    ],
    controllers: [AuthController],
})
export class AuthModule { }
