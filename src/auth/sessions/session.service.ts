import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtUtil } from 'src/common/utils/jwt.util';
import { CryptoUtil } from 'src/common/utils/crypto.util';
import { randomUUID } from 'crypto';
import { RoleName } from 'generated/prisma';
import { decryptData, encryptData } from '@/common/helper/common.helper';
import { Request } from 'express';

@Injectable()
export class SessionService {
    constructor(private prisma: PrismaService) { }

    // async createSession(user: any) {
    //     const session_id = randomUUID();

    //     const accessToken = JwtUtil.signAccessToken({
    //         sub: user.id.toString(),
    //         roles: RoleName.AGENT, // TODO: replace with actual org roles
    //         sid: session_id,
    //     });

    //     const refreshPlain = randomUUID() + randomUUID();
    //     const refreshHash = CryptoUtil.hash(refreshPlain);
    //     const refreshEncrypted = encryptData(refreshPlain);

    //     const session = await this.prisma.userSession.create({
    //         data: {
    //             session_id,
    //             user_id: user.id.toString(),
    //             refresh_token_hash: refreshHash,
    //             refresh_token_encrypted: refreshEncrypted,
    //             expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    //         },
    //     });

    //     return {
    //         sessionData: session,
    //         tokens: {
    //             access_token: encryptData(accessToken),
    //             refresh_token: refreshEncrypted,
    //             token_type: 'Bearer',
    //             expires_in: 900,
    //         },
    //     };
    // }

    // async createSession(user: any, req?: Request) {
    //     const session_id = randomUUID();

    //     const refreshPlain = randomUUID() + randomUUID();
    //     const refreshHash = CryptoUtil.hash(refreshPlain);
    //     const refreshEncrypted = encryptData(refreshPlain);

    //     const session = await this.prisma.userSession.create({
    //         data: {
    //             session_id,
    //             user_id: user.id,
    //             ip_address: req?.ip,
    //             device_info: req?.headers['user-agent'],
    //             refresh_token_hash: refreshHash,
    //             refresh_token_encrypted: refreshEncrypted,
    //             expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    //         },
    //     });

    //     return { session, refreshPlain };
    // }


    // async refreshToken(refreshEncrypted: string) {
    //     const refreshPlain = decryptData(refreshEncrypted);
    //     const refreshHash = CryptoUtil.hash(refreshPlain);

    //     const session = await this.prisma.userSession.findFirst({
    //         where: { refresh_token_hash: refreshHash, revoked: false },
    //     });

    //     if (!session) throw new UnauthorizedException('Invalid refresh token');

    //     // Rotate refresh token
    //     const newRefreshPlain = randomUUID() + randomUUID();
    //     const newHash = CryptoUtil.hash(newRefreshPlain);
    //     const newEncrypted = encryptData(newRefreshPlain);

    //     await this.prisma.userSession.update({
    //         where: { id: session.id },
    //         data: {
    //             refresh_token_hash: newHash,
    //             refresh_token_encrypted: newEncrypted,
    //             last_used_at: new Date(),
    //         },
    //     });

    //     // Generate new access token
    //     const accessToken = JwtUtil.signAccessToken({
    //         sub: session.user_id.toString(),
    //         sid: session.session_id,
    //     });

    //     return {
    //         access_token: encryptData(accessToken),
    //         refresh_token: newEncrypted,
    //         token_type: 'Bearer',
    //     };
    // }
}
