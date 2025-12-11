import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OtpService } from './otp/otp.service';
import { SessionService } from './sessions/session.service';
import { JwtUtil } from 'src/common/utils/jwt.util';
import { CryptoUtil } from 'src/common/utils/crypto.util';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private otpService: OtpService,
        private sessionService: SessionService,
    ) { }

    /* ============================================================
       SEND OTP
    ============================================================ */
    async sendOtp(dto: any) {
        const otp = await this.otpService.generateOtp(dto);
        return { ok: true, delivery_id: otp.delivery_id };
    }

    /* ============================================================
       LOGIN
    ============================================================ */
    async login(dto: LoginDto) {
        const { auth_type } = dto;

        let user: any;

        if (auth_type === 'email_pw') {
            user = await this.loginWithEmailPassword(dto);
        } else if (auth_type === 'email_otp' || auth_type === 'phone_otp') {
            user = await this.loginWithOtp(dto);
        } else if (auth_type === 'google') {
            user = await this.loginWithGoogle(dto);
        } else if (auth_type === 'apple') {
            user = await this.loginWithApple(dto);
        } else {
            throw new UnauthorizedException('Invalid auth_type');
        }

        // Create session + tokens
        const session = await this.sessionService.createSession(user);

        return {
            ok: true,
            user,
            tokens: session.tokens,
            session: session.sessionData,
        };
    }

    /* ============================================================
       EMAIL + PASSWORD
    ============================================================ */
    async loginWithEmailPassword(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) throw new UnauthorizedException('User not found');

        if (!dto.password) {
            throw new UnauthorizedException('Password is required for email/password login');
        }

        const valid = CryptoUtil.compareHash(dto.password, user.password_hash);
        if (!valid) throw new UnauthorizedException('Wrong password');

        return user;
    }


    /* ============================================================
       OTP LOGIN
    ============================================================ */
    async loginWithOtp(dto: LoginDto) {
        console.log(LoginDto, "LoginDto");
        // -----------------------------
        // TYPE NARROWING FOR TS STRICT
        // -----------------------------
        if (!dto.destination) {
            throw new UnauthorizedException('Destination is required');
        }

        if (!dto.delivery_id) {
            throw new UnauthorizedException('delivery_id is required');
        }

        if (!dto.otp) {
            throw new UnauthorizedException('OTP is required');
        }

        // Now TS knows destination, otp, delivery_id are DEFINITELY string
        // --------------------------------------------------------------

        const otpVerified = await this.otpService.verifyOtp(dto.delivery_id, dto.otp);
        if (!otpVerified) throw new UnauthorizedException('Invalid OTP');

        // Find user by email or phone
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.destination.includes('@') ? dto.destination : undefined },
                    { phone: !dto.destination.includes('@') ? dto.destination : undefined },
                ],
            },
        });

        // -----------------------------
        // CREATE USER IF NOT EXISTS
        // -----------------------------
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    full_name: 'New User',
                    email: dto.destination.includes('@') ? dto.destination : null,
                    phone: dto.destination.includes('@') ? null : dto.destination,
                    password_hash: '',
                },
            });
        }

        return user;
    }


    /* ============================================================
       SOCIAL LOGINS
    ============================================================ */
    async loginWithGoogle(dto: LoginDto) {
        // TODO modify google verification
        const googleEmail = dto.id_token;

        let user = await this.prisma.user.findUnique({
            where: { email: googleEmail },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    full_name: 'Google User',
                    email: googleEmail,
                    password_hash: '',
                },
            });
        }
        return user;
    }

    async loginWithApple(dto: LoginDto) {
        // TODO Apple token verification
        const appleEmail = dto.id_token;

        let user = await this.prisma.user.findUnique({
            where: { email: appleEmail },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    full_name: 'Apple User',
                    email: appleEmail,
                    password_hash: '',
                },
            });
        }
        return user;
    }

    /* ============================================================
       REFRESH TOKEN
    ============================================================ */
    async refresh(refreshToken: string) {
        return this.sessionService.refreshToken(refreshToken);
    }
}
