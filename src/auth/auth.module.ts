import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from 'src/otp/otp.service';
// import { SessionServi ce } from './sessions/session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
    providers: [
        AuthService,
        OtpService,
        MailService,
        // SessionService,
        JwtStrategy,
        JwtService,
        ConfigService,
        RefreshStrategy,
    ],
    controllers: [AuthController],
})
export class AuthModule { }
