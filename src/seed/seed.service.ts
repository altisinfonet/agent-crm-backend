import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../helper/common.helper';

@Injectable()
export class SeedService {
    constructor(private prisma: PrismaService) { }

    async seed() {

        //Role
        await this.prisma.role.createMany({
            data: [
                {
                    name: "ADMIN",
                    description: "admin"
                },
                {
                    name: "AGENT",
                    description: "agent"
                },
            ]
        })

        await this.prisma.user.createMany({
            data: [
                {
                    first_name: "Super",
                    last_name: "Admin",
                    email: "admin@gmail.com",
                    password: await hashPassword("l8n4n#On%c@m4JF&17$?"),
                    provider: "EMAIL_PW",
                    role_id: 1,
                }
            ]
        });

        console.log('Seed data inserted');
    }
}
