import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { decryptData } from '@/helper/common.helper';
import { getActiveBlockTtl } from '@/helper/rate-limit.helper';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const body = decryptData(req.body?.data);

        const authMethod = body?.auth_method;
        const ip = req.ip;

        let identifier: string | null = null;

        if (authMethod === 'EMAIL_PW' || authMethod === 'EMAIL_OTP') {
            identifier = body?.email;
        } else if (authMethod === 'PHONE_OTP') {
            identifier = body?.phone_no;
        }

        if (!identifier) return true;

        const ttl = await getActiveBlockTtl(identifier, ip);

        if (ttl > 0) {
            throw new HttpException(
                `Too many failed attempts. Try again after ${ttl} seconds.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return true;
    }
}
