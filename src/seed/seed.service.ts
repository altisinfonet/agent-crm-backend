import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../common/helper/common.helper';

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


        const productsData = [
            {
                name: "Fixed Deposit (FD)",
                slug: "fixed-deposit",
                desc: "A low-risk investment where a lump sum amount is deposited for a fixed tenure at a predetermined interest rate.",
                entities: [
                    {
                        name: "Regular Fixed Deposit",
                        slug: "regular-fixed-deposit",
                        desc: "Standard FD with fixed tenure and fixed interest payout at maturity or periodically.",
                    },
                    {
                        name: "Tax Saving Fixed Deposit",
                        slug: "tax-saving-fixed-deposit",
                        desc: "FD with a 5-year lock-in period eligible for tax deduction under Section 80C (India).",
                    },
                    {
                        name: "Senior Citizen Fixed Deposit",
                        slug: "senior-citizen-fixed-deposit",
                        desc: "FD offering higher interest rates for individuals aged 60 years and above.",
                    },
                    {
                        name: "Cumulative Fixed Deposit",
                        slug: "cumulative-fixed-deposit",
                        desc: "Interest is compounded and paid along with the principal at maturity.",
                    },
                    {
                        name: "Non-Cumulative Fixed Deposit",
                        slug: "non-cumulative-fixed-deposit",
                        desc: "Interest is paid at regular intervals such as monthly or quarterly.",
                    },
                ],
            },
            {
                name: "Insurance",
                slug: "insurance",
                desc: "A financial protection mechanism that covers risks related to life, health, assets, or liabilities.",
                entities: [
                    {
                        name: "Life Insurance",
                        slug: "life-insurance",
                        desc: "Provides financial support to the nominee in case of the policyholder’s death.",
                    },
                    {
                        name: "Health Insurance",
                        slug: "health-insurance",
                        desc: "Covers medical and hospitalization expenses.",
                    },
                    {
                        name: "General Insurance",
                        slug: "general-insurance",
                        desc: "Covers non-life risks such as property, travel, and fire.",
                    },
                    {
                        name: "Automobile Insurance",
                        slug: "automobile-insurance",
                        desc: "Covers vehicles against accidents, theft, and third-party liabilities.",
                    },
                ],
            },
            {
                name: "Mutual Funds",
                slug: "mutual-funds",
                desc: "Investment vehicle that pools money to invest in diversified securities managed by professionals.",
                entities: [
                    {
                        name: "Equity Funds",
                        slug: "equity-funds",
                        desc: "Invest primarily in stocks for higher growth potential.",
                    },
                    {
                        name: "Debt Funds",
                        slug: "debt-funds",
                        desc: "Invest in fixed-income instruments like bonds.",
                    },
                    {
                        name: "Hybrid Funds",
                        slug: "hybrid-funds",
                        desc: "Invest in a mix of equity and debt instruments.",
                    },
                    {
                        name: "Index Fund",
                        slug: "index-fund",
                        desc: "Passively tracks a market index with lower expense ratio.",
                    },
                    {
                        name: "ELSS",
                        slug: "elss",
                        desc: "Equity Linked Savings Scheme offering tax benefits with a 3-year lock-in.",
                    },
                ],
            },
            {
                name: "Real Estate",
                slug: "real-estate",
                desc: "Investment in physical property for income generation or capital appreciation.",
                entities: [
                    {
                        name: "Residential Property",
                        slug: "residential-property",
                        desc: "Properties used for living purposes such as apartments and villas.",
                    },
                    {
                        name: "Commercial Property",
                        slug: "commercial-property",
                        desc: "Properties used for business activities such as offices and retail shops.",
                    },
                    {
                        name: "Industrial Property",
                        slug: "industrial-property",
                        desc: "Properties used for manufacturing, storage, or logistics.",
                    },
                    {
                        name: "Land",
                        slug: "land",
                        desc: "Vacant plots or agricultural land held for development or investment.",
                    },
                ],
            },
        ];

        // =======================
        // SEED EXECUTION
        // =======================
        for (const product of productsData) {
            const createdProduct = await this.prisma.products.upsert({
                where: { slug: product.slug },
                update: {},
                create: {
                    name: product.name,
                    slug: product.slug,
                    desc: product.desc,
                },
            });

            await this.prisma.productEntity.createMany({
                data: product.entities.map((entity) => ({
                    name: entity.name,
                    slug: entity.slug,
                    desc: entity.desc,
                    product_id: createdProduct.id,
                })),
                skipDuplicates: true,
            });
        }


        // await this.prisma.products.createMany({
        //     data: [
        //         {
        //             name: "Life Insurance",
        //             slug: "life-insurance"
        //         },
        //         {
        //             name: "Medical Insurance",
        //             slug: "medical-insurance"
        //         },
        //         {
        //             name: "Real - estate",
        //             slug: "real-estate"
        //         },
        //         {
        //             name: "Mutual Fund",
        //             slug: "mutual-fund"
        //         }
        //     ]
        // })

        // await this.prisma.productEntity.createMany({
        //     data: [
        //         {
        //             product_id: 1,
        //             name: "LIC",
        //             slug: "lic"
        //         },
        //         {
        //             product_id: 1,
        //             name: "HDFC Life",
        //             slug: "hdfc-life"
        //         },
        //         {
        //             product_id: 1,
        //             name: "ICICI Prudential Life",
        //             slug: "icici-prudential-life"
        //         },
        //         {
        //             product_id: 2,
        //             name: "Star Health",
        //             slug: "star-health"
        //         },
        //         {
        //             product_id: 2,
        //             name: "HDFC ERGO",
        //             slug: "hdfc-ergo"
        //         },
        //         {
        //             product_id: 2,
        //             name: "ICICI Lombard",
        //             slug: "icici-lombard"
        //         },
        //         {
        //             product_id: 3,
        //             name: "DLF",
        //             slug: "dlf"
        //         },
        //         {
        //             product_id: 3,
        //             name: "Lodha Group",
        //             slug: "lodha-group"
        //         },
        //         {
        //             product_id: 4,
        //             name: "SBI Mutual Fund",
        //             slug: "sbi-mutual-fund"
        //         },
        //         {
        //             product_id: 4,
        //             name: "HDFC Mutual Fund",
        //             slug: "hdfc-mutual-fund"
        //         },
        //     ]
        // })

        await this.prisma.user.createMany({
            data: [
                {
                    first_name: "Agent",
                    last_name: "CRM",
                    email: "altisdev1@gmail.com",
                    password: await hashPassword("l8n4n#On%c@m4JF&17$?"),
                    auth_method: "EMAIL_PW",
                    role_id: 1,
                    currency_id: 1,
                    country_id: 1
                }
            ]
        });

        await this.prisma.adminSettings.create({
            data: {
                title: "payment-settings",
                metadata: {
                    razorpayid: "rzp_test_4zb9K0qHh06srW",
                    razorpaysecretkey: "B8uxIDjFDuk5MbB9Nq4q9YF8"
                }
            }
        })

        console.log('Seed data inserted');
    }
}
