import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL, // Must be passed explicitly in Prisma v7
                },
            },
            // log: ['query', 'info', 'warn', 'error'], // optional: advanced logging
        });
    }

    async onModuleInit() {
        await this.$connect();
        console.log('🚀 Prisma connected successfully');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('🛑 Prisma disconnected');
    }
}
