import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CryptoUtil } from 'src/common/utils/crypto.util';
import { OtpService } from 'src/otp/otp.service';
import { decryptData, encryptData } from 'src/helper/common.helper';
import { CommonDto } from './dto/common.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types/tokens.type';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { RoleName } from 'generated/prisma';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private otpService: OtpService,
        private jwtService: JwtService,
        private config: ConfigService,
        // private sessionService: SessionService,
    ) { }

    async auth(commonDto: CommonDto, req: Request): Promise<Tokens> {
        const payload = decryptData(commonDto.data);

        const {
            auth_method,
            email,
            phone_no,
            password,
            otp,
            provider_id,
            first_name,
            last_name,
        } = payload;

        if (!auth_method) {
            throw new BadRequestException('Auth method required');
        }


        await this.verifyAuth(payload);

        const where: any = {};

        if ((auth_method === 'EMAIL_OTP' || auth_method === "EMAIL_PW") && email) {
            where.email = email.toLowerCase();
        }

        if (auth_method === 'PHONE_OTP' && phone_no) {
            where.phone_no = phone_no;
        }

        if (
            (auth_method === 'GOOGLE' || auth_method === 'APPLE') &&
            provider_id
        ) {
            where.provider_id = provider_id;
        }

        // 4️⃣ Find user
        let user: any = await this.prisma.user.findUnique({
            where,
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_no: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

            },
        });

        // 5️⃣ Register if not exists
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    first_name,
                    last_name,
                    email: email?.toLowerCase(),
                    phone_no,
                    provider: auth_method,
                    provider_id,
                    role_id: BigInt(2),
                    country_id: 1,
                    currency_id: 1
                },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_no: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
        }

        // 6️⃣ Generate tokens
        const role = {
            id: user?.role.id.toString(),
            title: user?.role.name,
        };

        const { session, refreshPlain } = await this.createSession(user, req);
        const accessToken = this.jwtService.sign(
            {
                sub: user?.id.toString(),
                role,
                sid: session.session_id,
            },
            {
                secret: this.config.get('JWT_SECRET'),
                expiresIn: this.config.get('JWT_EXPIRATION'),
            },
        );

        return {
            accessToken,
            refreshToken: encryptData(refreshPlain),
        };
    }

    private async verifyAuth(payload: any) {
        const { auth_method, otp, email, phone_no, password, provider_id } = payload;
        const verifyOtp: any = {
            otp
        }
        try {
            if (auth_method === 'EMAIL_PW') {
                const user = await this.prisma.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    throw new UnauthorizedException('Invalid credentials');
                }
                const passwordMatches = await bcrypt.compare(password, user.password);
                if (!passwordMatches) {
                    throw new UnauthorizedException('Invalid credentials');
                }
                return true;
            }

            if (auth_method === 'EMAIL_OTP') {
                verifyOtp.credential = email;
                verifyOtp.is_email = true;

                if (!email || !otp) throw new Error();
                await this.otpService.verifyOtp(verifyOtp);
                return;
            }

            if (auth_method === 'PHONE_OTP') {
                verifyOtp.credential = phone_no;
                verifyOtp.is_email = false
                if (!phone_no || !otp) throw new Error();
                await this.otpService.verifyOtp(verifyOtp);
                return;
            }

            if (auth_method === 'GOOGLE' || auth_method === 'APPLE') {
                if (!provider_id) throw new Error();
                // provider token already verified upstream
                return;
            }

            throw new Error();
        } catch (e) {
            throw new UnauthorizedException(e.message || 'Invalid credentials');
        }
    }

    async createSession(user: any, req?: Request) {
        const session_id = randomUUID();

        const refreshPlain = randomUUID() + randomUUID();
        const refreshHash = CryptoUtil.hash(refreshPlain);
        const refreshEncrypted = encryptData(refreshPlain);

        const session = await this.prisma.userSession.create({
            data: {
                session_id,
                user_id: user.id,
                ip_address: req?.ip,
                device_info: req?.headers['user-agent'],
                refresh_token_hash: refreshHash,
                refresh_token_encrypted: refreshEncrypted,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        return { session, refreshPlain };
    }

    async refreshTokens(data: string): Promise<Tokens> {
        const { refreshToken } = decryptData(data);

        const refreshHash = CryptoUtil.hash(decryptData(refreshToken));

        const session = await this.prisma.userSession.findFirst({
            where: {
                refresh_token_hash: refreshHash,
                revoked: false,
                expires_at: { gt: new Date() },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        role: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        if (!session) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // rotate refresh token
        const newPlain = randomUUID() + randomUUID();
        const newHash = CryptoUtil.hash(newPlain);

        await this.prisma.userSession.update({
            where: { id: session.id },
            data: {
                refresh_token_hash: newHash,
                last_used_at: new Date(),
            },
        });

        const role = {
            id: session.user.role.id.toString(),
            title: session.user.role.name,
        };

        const accessToken = this.jwtService.sign(
            {
                sub: session.user.id.toString(),
                role,
                sid: session.session_id,
            },
            {
                secret: this.config.get('JWT_SECRET'),
                expiresIn: this.config.get('JWT_EXPIRATION'),
            },
        );

        return {
            accessToken,
            refreshToken: encryptData(newPlain),
        };
    }

    async logout(userId: bigint, sid: string) {
        await this.prisma.userSession.updateMany({
            where: {
                user_id: userId,
                session_id: sid,
                revoked: false,
            },
            data: {
                revoked: true,
                last_used_at: new Date(),
            },
        });
        return true;
    }

    async logoutAll(userId: bigint) {
        await this.prisma.userSession.updateMany({
            where: {
                user_id: userId,
                revoked: false,
            },
            data: {
                revoked: true,
                last_used_at: new Date(),
            },
        });
        return true;
    }


    async TestEncryption(body: any) {
        try {
            return await encryptData(body);
        } catch (error) {
            throw error
        }
    }

    async TestDecryption(body: any) {
        try {
            const data = await decryptData(body.data);
            return data;
        } catch (error) {
            throw error
        }
    }

}
