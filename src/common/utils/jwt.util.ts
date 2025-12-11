import * as jwt from 'jsonwebtoken';

export class JwtUtil {
    static signAccessToken(payload: any) {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '15m',
        });
    }
}
