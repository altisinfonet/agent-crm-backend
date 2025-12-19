import { Injectable } from '@nestjs/common';
import { hashPassword } from '../helper/common.helper';
import { PrismaService } from '../prisma/prisma.service';

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


        await this.prisma.country.createMany({
            data: [
                {
                    name: "India",
                    region: "Asia",
                    iso_code: "IN",
                    phoneLength: 6,
                    phone_code: "+91",
                    timezone: "Asia/Kolkata",
                    utc_offset_min: 330,
                    image: "https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/IN.svg"
                }
            ]
        })


        await this.prisma.currency.createMany({
            data: [
                {
                    name: "Indian Rupee",
                    code: "INR",
                    symbol: "₹",
                    exchange_rate: 1,
                }
            ]
        })

        await this.prisma.products.createMany({
            data: [
                {
                    name: "Life Insurance",
                },
                {
                    name: "Medical Insurance ",
                },
                {
                    name: "Real - estate ",
                },
                {
                    name: "mutual Fund",
                }
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
                    currency_id: 1,
                    country_id: 1
                }
            ]
        });

        console.log('Seed data inserted');
    }
}
