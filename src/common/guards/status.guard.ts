import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Account, Approve, Onboarding } from '../enum/account.enum';
import { ACCOUNT_KEY, APPROVAL_KEY, ONBOARDING_KEY } from '../decorators/status.decorator';


@Injectable()
export class AccountStatusGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredStatus = this.reflector.getAllAndOverride<Account[]>(ACCOUNT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredStatus) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!requiredStatus.includes(user.status)) {
            throw new UnauthorizedException('You do not have access to this resource');
        }

        return true;
    }
}

@Injectable()
export class ApprovalStatusGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredStatus = this.reflector.getAllAndOverride<Approve[]>(APPROVAL_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredStatus) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!requiredStatus.includes(user.kycStatus)) {
            throw new UnauthorizedException('You do not have access to this resource');
        }
        return true;
    }
}

@Injectable()
export class OnboardingStatusGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredStatus = this.reflector.getAllAndOverride<Onboarding[]>(ONBOARDING_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredStatus) return true;

        const { user } = context.switchToHttp().getRequest();

        if (!requiredStatus.includes(user.onboardingStatus)) {
            throw new UnauthorizedException('You do not have access to this resource');
        }

        return true;
    }
}