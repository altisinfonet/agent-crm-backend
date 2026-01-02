import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from 'src/otp/otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpModule } from '@/otp/otp.module';
import { MailModule } from '@/mail/mail.module';

@Module({
    imports: [OtpModule, MailModule, JwtModule.register({})],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        JwtService,
        ConfigService,
    ],
})
export class AuthModule { }
