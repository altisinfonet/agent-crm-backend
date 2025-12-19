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
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.get('JWT_SECRET'),
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

        return payload;
    }

}
