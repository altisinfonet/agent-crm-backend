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
            {
                name: "Loans",
                slug: "loans",
                desc: "A financial product where a lender provides money to a borrower that must be repaid with interest over a specified period.",
                entities: [
                    {
                        name: "Personal Loan",
                        slug: "personal-loan",
                        desc: "An unsecured loan used for personal expenses like travel, weddings, or medical emergencies."
                    },
                    {
                        name: "Home Loan",
                        slug: "home-loan",
                        desc: "A loan taken to purchase, build, or renovate a residential property."
                    },
                    {
                        name: "Business Loan",
                        slug: "business-loan",
                        desc: "A loan designed to support business needs such as expansion, working capital, or equipment purchase."
                    },
                    {
                        name: "Loan Against Property",
                        slug: "loan-against-property",
                        desc: "A secured loan where residential or commercial property is used as collateral."
                    },
                    {
                        name: "Vehicle Loan",
                        slug: "vehicle-loan",
                        desc: "A loan used to purchase vehicles such as cars, bikes, or commercial vehicles."
                    },
                    {
                        name: "Education Loan",
                        slug: "education-loan",
                        desc: "A loan provided to students to cover tuition fees, books, and other education-related expenses."
                    },
                    {
                        name: "Gold Loan",
                        slug: "gold-loan",
                        desc: "A secured loan where gold jewelry or ornaments are pledged as collateral."
                    },

                ]
            }
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

        await this.prisma.user.createMany({
            data: [
                {
                    first_name: "Agent",
                    last_name: "CRM",
                    email: "altisdev1@gmail.com",
                    password: await hashPassword("Admin@123"),
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
