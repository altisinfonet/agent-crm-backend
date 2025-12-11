import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtUtil } from 'src/common/utils/jwt.util';
import { CryptoUtil } from 'src/common/utils/crypto.util';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionService {
    constructor(private prisma: PrismaService) { }

    async createSession(user: any) {
        const session_id = randomUUID();

        const accessToken = JwtUtil.signAccessToken({
            sub: user.id,
            roles: ['AGENT'], // TODO: replace with actual org roles
            sid: session_id,
        });

        const refreshPlain = randomUUID() + randomUUID();
        const refreshHash = CryptoUtil.hash(refreshPlain);
        const refreshEncrypted = CryptoUtil.encrypt(refreshPlain);

        const session = await this.prisma.userSession.create({
            data: {
                session_id,
                user_id: user.id,
                refresh_token_hash: refreshHash,
                refresh_token_encrypted: refreshEncrypted,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        return {
            sessionData: session,
            tokens: {
                access_token: CryptoUtil.encrypt(accessToken),
                refresh_token: refreshEncrypted,
                token_type: 'Bearer',
                expires_in: 900,
            },
        };
    }

    async refreshToken(refreshEncrypted: string) {
        const refreshPlain = CryptoUtil.decrypt(refreshEncrypted);
        const refreshHash = CryptoUtil.hash(refreshPlain);

        const session = await this.prisma.userSession.findFirst({
            where: { refresh_token_hash: refreshHash, revoked: false },
        });

        if (!session) throw new UnauthorizedException('Invalid refresh token');

        // Rotate refresh token
        const newRefreshPlain = randomUUID() + randomUUID();
        const newHash = CryptoUtil.hash(newRefreshPlain);
        const newEncrypted = CryptoUtil.encrypt(newRefreshPlain);

        await this.prisma.userSession.update({
            where: { id: session.id },
            data: {
                refresh_token_hash: newHash,
                refresh_token_encrypted: newEncrypted,
                last_used_at: new Date(),
            },
        });

        // Generate new access token
        const accessToken = JwtUtil.signAccessToken({
            sub: session.user_id,
            sid: session.session_id,
        });

        return {
            access_token: CryptoUtil.encrypt(accessToken),
            refresh_token: newEncrypted,
            token_type: 'Bearer',
        };
    }
}
