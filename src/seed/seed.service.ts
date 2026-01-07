import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '@/common/helper/common.helper';

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

        await this.prisma.subscriptionFeature.createMany({
            data: [
                {
                    key: "customer_management",
                    name: "Customer Management",
                    description: "Manage up to 500 customers with full profile details, notes, and contact history."
                },
                {
                    key: "product_tracking",
                    name: "Product & Policy Tracking",
                    description: "Track sold products like Life, Medical Insurance, and Real Estate with policy details."
                },
                {
                    key: "company_entities",
                    name: "Insurance & Company Entities",
                    description: "Manage multiple entities such as LIC, ICICI Life, HDFC Ergo, and others."
                },
                {
                    key: "renewal_reminders",
                    name: "Renewal Reminders",
                    description: "Get automated reminders for policy renewals and follow-ups."
                },
                {
                    key: "basic_reports",
                    name: "Basic Reports",
                    description: "View basic sales, commission, and customer reports."
                },
                {
                    key: "document_storage",
                    name: "Document Storage",
                    description: "Upload and store customer documents and policy files securely."
                },
                {
                    key: "email_support",
                    name: "Standard Support",
                    description: "Email-based customer support during business hours."
                },
                {
                    key: "unlimited_customers",
                    name: "Unlimited Customers",
                    description: "Add and manage unlimited customers without any restrictions."
                },
                {
                    key: "advanced_crm",
                    name: "Advanced CRM Tools",
                    description: "Advanced tagging, segmentation, and smart search for customers."
                },
                {
                    key: "commission_management",
                    name: "Commission Management",
                    description: "Automatically calculate and track commissions by product and company."
                },
                {
                    key: "team_management",
                    name: "Team & Sub-Agent Management",
                    description: "Add sub-agents or staff and control access with role-based permissions."
                },
                {
                    key: "analytics_dashboard",
                    name: "Advanced Analytics Dashboard",
                    description: "Visual dashboards for sales performance, renewals, and revenue insights."
                },
                {
                    key: "automation",
                    name: "Task & Follow-up Automation",
                    description: "Automate follow-ups, reminders, and customer communication workflows."
                },
                {
                    key: "data_export",
                    name: "Data Export & Backup",
                    description: "Export customer, policy, and sales data in Excel or CSV format."
                },
                {
                    key: "priority_support",
                    name: "Priority Support",
                    description: "Priority email and chat support with faster response times."
                }
            ]
        })

        await this.prisma.subscriptionPlanFeature.createMany({
            data: [
                {
                    plan_id: 1,
                    feature_id: 1
                },
                {
                    plan_id: 1,
                    feature_id: 2
                },
                {
                    plan_id: 1,
                    feature_id: 3
                },
                {
                    plan_id: 1,
                    feature_id: 4
                },
                {
                    plan_id: 1,
                    feature_id: 5
                },
                {
                    plan_id: 1,
                    feature_id: 6
                },
                {
                    plan_id: 1,
                    feature_id: 7
                },
                {
                    plan_id: 2,
                    feature_id: 1
                },
                {
                    plan_id: 2,
                    feature_id: 2
                },
                {
                    plan_id: 2,
                    feature_id: 3
                },
                {
                    plan_id: 2,
                    feature_id: 4
                },
                {
                    plan_id: 2,
                    feature_id: 5
                },
                {
                    plan_id: 2,
                    feature_id: 6
                },
                {
                    plan_id: 2,
                    feature_id: 7
                },
                {
                    plan_id: 2,
                    feature_id: 8
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
