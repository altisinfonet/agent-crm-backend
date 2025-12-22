import { Injectable } from '@nestjs/common';
import { generateSlug, hashPassword } from '../helper/common.helper';
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
                    phoneLength: 10,
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
                    slug: "life-insurance"
                },
                {
                    name: "Medical Insurance",
                    slug: "medical-insurance"
                },
                {
                    name: "Real - estate",
                    slug: "real-estate"
                },
                {
                    name: "Mutual Fund",
                    slug: "mutual-fund"
                }
            ]
        })

        await this.prisma.productEntity.createMany({
            data: [
                {
                    product_id: 1,
                    name: "LIC",
                    slug: "lic"
                },
                {
                    product_id: 1,
                    name: "HDFC Life",
                    slug: "hdfc-life"
                },
                {
                    product_id: 1,
                    name: "ICICI Prudential Life",
                    slug: "icici-prudential-life"
                },
                {
                    product_id: 2,
                    name: "Star Health",
                    slug: "star-health"
                },
                {
                    product_id: 2,
                    name: "HDFC ERGO",
                    slug: "hdfc-ergo"
                },
                {
                    product_id: 2,
                    name: "ICICI Lombard",
                    slug: "icici-lombard"
                },
                {
                    product_id: 3,
                    name: "DLF",
                    slug: "dlf"
                },
                {
                    product_id: 3,
                    name: "Lodha Group",
                    slug: "lodha-group"
                },
                {
                    product_id: 4,
                    name: "SBI Mutual Fund",
                    slug: "sbi-mutual-fund"
                },
                {
                    product_id: 4,
                    name: "HDFC Mutual Fund",
                    slug: "hdfc-mutual-fund"
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
                    auth_method: "EMAIL_PW",
                    role_id: 1,
                    currency_id: 1,
                    country_id: 1
                }
            ]
        });

        console.log('Seed data inserted');
    }
}
