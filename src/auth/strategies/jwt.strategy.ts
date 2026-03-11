import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        const jwtSecret = config.get<string>('JWT_SECRET') || process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
        });
    }

    async validate(payload: any) {
        const session = await this.prisma.userSession.findFirst({
            where: {
                session_id: payload.sid,
                user_id: BigInt(payload.sub),
                revoked: false,
                expires_at: { gt: new Date() },
            },
        });

        if (!session) {
            throw new UnauthorizedException('Session expired');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(payload.sub) },
            select: {
                id: true,
                email: true,
                onboardingStatus: true,
                agentKYC: {
                    select: {
                        kyc_status: true,
                    },
                }
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }

        return {
            ...payload,
            userId: user.id,
            email: user.email,
            onboardingStatus: user.onboardingStatus,
            kycStatus: user.agentKYC?.kyc_status || null,
        };
    }

}
