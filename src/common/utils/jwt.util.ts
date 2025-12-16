import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
@Injectable()
export class JwtUtil {
    constructor(private readonly config: ConfigService) { }

    signAccessToken(payload: any) {
        return jwt.sign(
            payload,
            this.config.get<string>('JWT_SECRET') as string,
            { expiresIn: '15m' },
        );
    }
}
