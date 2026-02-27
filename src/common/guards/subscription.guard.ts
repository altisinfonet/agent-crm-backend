import { PrismaService } from '@/prisma/prisma.service';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;

        console.log("userId", request.user);


        if (!userId) {
            throw new ForbiddenException('Unauthorized');
        }

        const org = await this.prisma.organization.findUnique({
            where: { created_by: userId },
            select: { id: true },
        });

        if (!org) {
            throw new ForbiddenException(
                'Organization not found'
            );
        }

        const now = new Date();

        const subscription =
            await this.prisma.organizationSubscription.findFirst({
                where: {
                    org_id: org.id,
                    status: {
                        in: ['ACTIVE', 'TRIAL', 'PAUSED', 'UPGRADED'],
                    },
                    OR: [
                        { end_at: null },
                        { end_at: { gt: now } },
                    ],
                },
                orderBy: [
                    { start_at: 'desc' },
                    { created_at: 'desc' },
                ],
            });

        if (!subscription) {
            throw new ForbiddenException(
                'Active subscription required'
            );
        }

        return true;
    }
}