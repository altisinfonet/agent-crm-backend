// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-custom';
// import { Request } from 'express';
// import { CryptoUtil } from 'src/common/utils/crypto.util';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
//     constructor(private prisma: PrismaService) {
//         super();
//     }

//     /**
//      * Custom refresh token strategy.
//      * Extracts refresh_token from:
//      * - Authorization header
//      * - Body
//      * - Cookies (optional)
//      */
//     async validate(req: Request): Promise<any> {
//         const refreshEncrypted =
//             req.body?.refresh_token ||
//             req.headers['x-refresh-token'] ||
//             req.cookies?.refresh_token;

//         if (!refreshEncrypted) {
//             throw new UnauthorizedException('Refresh token missing');
//         }

//         let refreshPlain: string;
//         try {
//             refreshPlain = CryptoUtil.decrypt(refreshEncrypted);
//         } catch {
//             throw new UnauthorizedException('Invalid refresh token format');
//         }

//         const refreshHash = CryptoUtil.hash(refreshPlain);

//         const session = await this.prisma.userSession.findFirst({
//             where: {
//                 refresh_token_hash: refreshHash,
//                 revoked: false,
//             },
//             include: {
//                 user: true,
//             },
//         });

//         if (!session || !session.user) {
//             throw new UnauthorizedException('Invalid or expired refresh token');
//         }

//         return {
//             session,
//             user: session.user,
//         };
//     }
// }
