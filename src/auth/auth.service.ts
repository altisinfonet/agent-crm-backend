import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CryptoUtil } from 'src/common/utils/crypto.util';
import {
    decryptData,
    encryptData,
    generateRandomID,
    hashPassword,
} from '@/common/helper/common.helper';
import { CommonDto } from './dto/common.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types/tokens.type';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { verifyOtpDto } from 'src/otp/dto/verify-otp.dto';
import { MailService } from '@/mail/mail.service';
import { OtpService } from '@/otp/otp.service';
import {
    handleAuthFailure,
    resetAuthLimits,
} from '@/common/helper/rate-limit.helper';
import { generateUniqueUsername } from '@/common/helper/username.helper';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private mailService: MailService,
        private otpService: OtpService,
    ) { }

    async checkUser(commonDto: CommonDto) {
        try {
            const payload = decryptData(commonDto.data);
            const { credential } = payload;

            if (!credential) {
                return {
                    is_exists: false,
                    is_admin: false,
                };
            }
            const normalizedCredential = credential.trim();
            const user = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: { equals: normalizedCredential, mode: 'insensitive' } },
                        { phone_no: normalizedCredential },
                    ],
                    is_deleted: false,
                },
                select: {
                    id: true,
                    email: true,
                    phone_no: true,
                    role: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            const data = {
                // id: user?.id,
                // email: user?.email,
                // phone_no: user?.phone_no,
                is_exists: !!user,
                is_admin: user?.role?.name === 'ADMIN',
            };

            return data;
        } catch (error) {
            throw error;
        }
    }

    async auth(commonDto: CommonDto, req: Request): Promise<Tokens> {
        try {
            const payload = decryptData(commonDto.data);

            const {
                auth_method,
                email,
                phone_no,
                password,
                otp,
                provider_id,
                first_name,
                last_name,
            } = payload;

            if (!auth_method) {
                throw new BadRequestException('Auth method required');
            }

            if (
                auth_method === 'EMAIL_PW' ||
                auth_method === 'EMAIL_OTP' ||
                auth_method === 'PHONE_OTP'
            ) {
                await this.verifyAuth(payload, req.ip as string);
            }

            const where: any = {};

            if (
                (auth_method === 'EMAIL_PW' ||
                    auth_method === 'EMAIL_OTP' ||
                    auth_method === 'GOOGLE' ||
                    auth_method === 'APPLE') &&
                email
            ) {
                where.email = email.toLowerCase();
            }

            if (auth_method === 'PHONE_OTP' && phone_no) {
                where.phone_no = phone_no;
            }

            let user: any = await this.prisma.user.findUnique({
                where,
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    user_name: true,
                    email: true,
                    phone_no: true,
                    provider_id: true,
                    auth_method: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    status: true,
                },
            });

            if (user?.status === 'INACTIVE') {
                throw new BadRequestException('Sorry, your account is Suspended.');
            }

            if (auth_method === 'GOOGLE' || auth_method === 'APPLE') {
                if (!provider_id) {
                    throw new BadRequestException('Provider ID required');
                }

                if (user && user.auth_method === 'EMAIL_OTP') {
                    throw new BadRequestException(
                        'Invalid login method. Please log in using Email & OTP.',
                    );
                }
                if (user && user.auth_method === 'EMAIL_PW') {
                    throw new BadRequestException(
                        'Invalid login method. Please log in using Email & Password.',
                    );
                }

                if (user) {
                    const ok = await bcrypt.compare(provider_id, user.provider_id);
                    if (!ok) {
                        await handleAuthFailure(email, req.ip as string);
                        throw new BadRequestException('Invalid credentials');
                    }
                    await resetAuthLimits(email, req.ip as string);
                }
            }

            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        first_name,
                        last_name,
                        email: email?.toLowerCase(),
                        phone_no,
                        auth_method: auth_method,
                        provider_id:
                            auth_method === 'GOOGLE' || auth_method === 'APPLE'
                                ? await hashPassword(provider_id)
                                : null,
                        role_id: BigInt(2),
                        country_id: 1,
                        currency_id: 1,
                    },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        user_name: true,
                        email: true,
                        phone_no: true,
                        role: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        status: true,
                    },
                });
                // const org = await this.prisma.organization.create({
                //     data: {
                //         name: `${first_name} ${last_name}`,
                //         created_by: user?.id,
                //         gst_number: "",
                //         pan_number: "",
                //         contact_email: email,
                //         contact_phone: phone_no,
                //     }
                // })
            }

            user = await this.ensureAgentUserName(user);

            // 6️⃣ Generate tokens
            const role = {
                id: user?.role.id.toString(),
                title: user?.role.name,
            };

            const { session, refreshPlain } = await this.createSession(user, req);
            const accessToken = this.jwtService.sign(
                {
                    sub: user?.id.toString(),
                    role,
                    sid: session.session_id,
                    status: user?.status,
                },
                {
                    secret: this.config.get('JWT_SECRET'),
                    expiresIn: this.config.get('JWT_EXPIRATION'),
                },
            );

            return {
                accessToken,
                refreshToken: encryptData(refreshPlain),
            };
        } catch (error) {
            throw error;
        }
    }

    private async ensureAgentUserName(user: any) {
        if (!user || user?.role?.name !== 'AGENT' || user?.user_name) {
            return user;
        }

        const generatedUserName = await generateUniqueUsername(
            this.prisma,
            user?.first_name,
            user?.last_name,
            user?.id,
        );

        return this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                user_name: generatedUserName,
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                user_name: true,
                email: true,
                phone_no: true,
                provider_id: true,
                auth_method: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                status: true,
            },
        });
    }

    private async verifyAuth(payload: any, ip: string) {
        const { auth_method, otp, email, phone_no, password } = payload;

        const identifier =
            auth_method === 'EMAIL_PW' || auth_method === 'EMAIL_OTP'
                ? email
                : phone_no;

        const verifyOtp: any = { otp };

        try {
            // ========== EMAIL PASSWORD ==========
            if (auth_method === 'EMAIL_PW') {
                const user = await this.prisma.user.findFirst({
                    where: {
                        auth_method: 'EMAIL_PW',
                        email: {
                            equals: email,
                            mode: 'insensitive',
                        },
                    },
                });

                if (!user) {
                    await handleAuthFailure(identifier, ip);
                    throw new BadRequestException('Invalid credentials');
                }

                const ok = await bcrypt.compare(password, user.password);
                if (!ok) {
                    await handleAuthFailure(identifier, ip);
                    throw new BadRequestException('Invalid credentials');
                }
                await resetAuthLimits(identifier, ip);
                return true;
            }

            // ========== EMAIL OTP ==========
            if (auth_method === 'EMAIL_OTP') {
                if (!email || !otp) {
                    throw new BadRequestException('Email and OTP required');
                }

                verifyOtp.credential = email;
                verifyOtp.is_email = true;

                await this.otpService.verifyOtp(verifyOtp);

                await resetAuthLimits(identifier, ip);
                return true;
            }

            // ========== PHONE OTP ==========
            if (auth_method === 'PHONE_OTP') {
                if (!phone_no || !otp) {
                    throw new BadRequestException('Phone number and OTP required');
                }

                verifyOtp.credential = phone_no;
                verifyOtp.is_email = false;

                await this.otpService.verifyOtp(verifyOtp);

                await resetAuthLimits(identifier, ip);
                return true;
            }

            throw new BadRequestException('Invalid authentication method');
        } catch (err) {
            if (identifier) {
                await handleAuthFailure(identifier, ip);
            }
            throw err;
        }
    }

    async createSession(user: any, req?: Request) {
        const session_id = randomUUID();

        const refreshPlain = randomUUID() + randomUUID();
        const refreshHash = CryptoUtil.hash(refreshPlain);
        const refreshEncrypted = encryptData(refreshPlain);

        const session = await this.prisma.userSession.create({
            data: {
                session_id,
                user_id: user.id,
                ip_address: req?.ip,
                device_info: req?.headers['user-agent'],
                refresh_token_hash: refreshHash,
                refresh_token_encrypted: refreshEncrypted,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        return { session, refreshPlain };
    }

    async refreshTokens(data: string): Promise<Tokens> {
        try {
            const { refreshToken } = decryptData(data);

            const refreshHash = CryptoUtil.hash(decryptData(refreshToken));

            const session = await this.prisma.userSession.findFirst({
                where: {
                    refresh_token_hash: refreshHash,
                    revoked: false,
                    expires_at: { gt: new Date() },
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            role: {
                                select: { id: true, name: true },
                            },
                            status: true,
                        },
                    },
                },
            });

            if (!session) {
                throw new BadRequestException('Session expired');
            }

            // rotate refresh token
            const newPlain = randomUUID() + randomUUID();
            const newHash = CryptoUtil.hash(newPlain);

            await this.prisma.userSession.update({
                where: { id: session.id },
                data: {
                    refresh_token_hash: newHash,
                    last_used_at: new Date(),
                },
            });

            const role = {
                id: session.user.role.id.toString(),
                title: session.user.role.name,
            };

            const accessToken = this.jwtService.sign(
                {
                    sub: session.user.id.toString(),
                    role,
                    sid: session.session_id,
                    status: session.user.status,
                },
                {
                    secret: this.config.get('JWT_SECRET'),
                    expiresIn: this.config.get('JWT_EXPIRATION'),
                },
            );

            return {
                accessToken,
                refreshToken: encryptData(newPlain),
            };
        } catch (error) {
            throw error;
        }
    }

    async logout(userId: bigint, sid: string) {
        try {
            await this.prisma.userSession.updateMany({
                where: {
                    user_id: userId,
                    session_id: sid,
                    revoked: false,
                },
                data: {
                    revoked: true,
                    last_used_at: new Date(),
                },
            });
            return true;
        } catch (error) {
            throw error;
        }
    }

    async logoutAll(userId: bigint) {
        await this.prisma.userSession.updateMany({
            where: {
                user_id: userId,
                revoked: false,
            },
            data: {
                revoked: true,
                last_used_at: new Date(),
            },
        });
        return true;
    }

    async deleteAgentAccount(dto: CommonDto) {
        try {
            const payload = decryptData(dto.data);
            console.log('payload', payload);

            const rawEmail = payload?.email?.trim();
            const otp = payload?.otp?.trim();

            if (!rawEmail || !otp) {
                throw new BadRequestException('Email and OTP are required.');
            }

            const normalizedEmail = rawEmail.toLowerCase();

            const agent = await this.prisma.user.findFirst({
                where: {
                    email: {
                        equals: normalizedEmail,
                        mode: 'insensitive',
                    },
                    role: {
                        name: 'AGENT',
                    },
                    is_deleted: false,
                },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    user_name: true,
                    email: true,
                    phone_no: true,
                    provider_id: true,
                    agentKYC: {
                        select: {
                            pan_number: true,
                            aadhar_number: true,
                        },
                    },
                },
            });

            if (!agent) {
                throw new BadRequestException('Agent account not found.');
            }

            await this.otpService.verifyOtp({
                credential: rawEmail,
                otp,
                is_email: true,
            });

            const displayName =
                `${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim() || 'User';
            const targetEmail = agent.email ?? rawEmail;
            setImmediate(async () => {
                try {
                    await this.mailService.sendAccountDeletedEmail(
                        targetEmail,
                        displayName,
                    );
                } catch (error) {
                    console.error('Error sending account deleted email', error);
                }
            });

            const deletedSuffix = `${Date.now()}_${agent.id.toString()}`;
            const deletedEmail = this.buildDeletedFieldValue(
                agent.email,
                deletedSuffix,
            );
            const deletedPhone = this.buildDeletedFieldValue(
                agent.phone_no,
                deletedSuffix,
            );
            const deletedProviderId = this.buildDeletedFieldValue(
                agent.provider_id,
                deletedSuffix,
            );

            await this.prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: {
                        id: agent.id,
                    },
                    data: {
                        is_deleted: true,
                        status: 'INACTIVE',
                        email: deletedEmail,
                        phone_no: deletedPhone,
                        provider_id: deletedProviderId,
                        refresh_token: null,
                        reset_token: null,
                        reset_token_exp: null,
                    },
                });

                if (agent.agentKYC) {
                    await tx.agentKYC.update({
                        where: {
                            agent_id: agent.id,
                        },
                        data: {
                            pan_number:
                                this.buildDeletedFieldValue(
                                    agent.agentKYC.pan_number,
                                    deletedSuffix,
                                ) ?? agent.agentKYC.pan_number,
                            aadhar_number:
                                this.buildDeletedFieldValue(
                                    agent.agentKYC.aadhar_number,
                                    deletedSuffix,
                                ) ?? agent.agentKYC.aadhar_number,
                        },
                    });
                }

                await tx.userSession.deleteMany({
                    where: {
                        user_id: agent.id,
                    },
                });

                await tx.invalidatedToken.deleteMany({
                    where: {
                        user_id: agent.id,
                    },
                });

                await tx.userFCMToken.deleteMany({
                    where: {
                        user_id: agent.id,
                    },
                });
            });

            return true;
        } catch (error) {
            throw error;
        }
    }

    async downloadAgentData(dto: CommonDto) {
        try {
            const payload = decryptData(dto.data);
            const rawEmail = payload?.email?.trim();
            const otp = payload?.otp?.trim();

            if (!rawEmail || !otp) {
                throw new BadRequestException('Email and OTP are required.');
            }

            const normalizedEmail = rawEmail.toLowerCase();

            const agent = await this.prisma.user.findFirst({
                where: {
                    email: {
                        equals: normalizedEmail,
                        mode: 'insensitive',
                    },
                    role: {
                        name: 'AGENT',
                    },
                    is_deleted: false,
                },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    user_name: true,
                    email: true,
                },
            });

            if (!agent) {
                throw new BadRequestException('Agent account not found.');
            }

            await this.otpService.verifyOtp({
                credential: rawEmail,
                otp,
                is_email: true,
            });

            const reportData = await this.fetchAgentDataForReport(agent.id);
            const reportText = this.buildAgentDataReport(reportData);
            const displayName =
                `${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim() || 'User';

            setImmediate(async () => {
                try {
                    await this.mailService.sendDataExportEmail(
                        rawEmail,
                        displayName,
                        reportText,
                    );
                } catch (error) {
                    console.error('Error sending data export email', error);
                }
            });
            return true;
        } catch (error) {
            throw error;
        }
    }

    private async fetchAgentDataForReport(agentId: bigint) {
        const [user, sales] = await this.prisma.$transaction([
            this.prisma.user.findUnique({
                where: { id: agentId },
                include: {
                    role: true,
                    country: true,
                    currency: true,
                    agentKYC: true,
                    organizations: {
                        include: {
                            subscription: {
                                include: {
                                    plan: {
                                        include: {
                                            currency: true,
                                        },
                                    },
                                },
                                orderBy: { created_at: 'desc' },
                            },
                            users: {
                                include: {
                                    role: true,
                                    user: {
                                        select: {
                                            id: true,
                                            first_name: true,
                                            last_name: true,
                                            user_name: true,
                                            email: true,
                                            phone_no: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { created_at: 'desc' },
                    },
                    orgUsers: {
                        include: {
                            role: true,
                            organization: true,
                        },
                        orderBy: { created_at: 'desc' },
                    },
                    customers: {
                        include: {
                            country: true,
                        },
                        orderBy: { created_at: 'desc' },
                    },
                    meetings: {
                        include: {
                            customer: true,
                        },
                        orderBy: { created_at: 'desc' },
                    },
                    toDos: {
                        include: {
                            organization: true,
                        },
                        orderBy: { created_at: 'desc' },
                    },
                    inAppNotifications: {
                        orderBy: { created_at: 'desc' },
                    },
                    agentProductEntities: {
                        include: {
                            productEntity: {
                                include: {
                                    products: true,
                                },
                            },
                        },
                        orderBy: { created_at: 'desc' },
                    },
                },
            }),
            this.prisma.agentSale.findMany({
                where: { agent_id: agentId },
                include: {
                    organization: true,
                    customer: true,
                    productEntity: {
                        include: {
                            products: true,
                        },
                    },
                    fixedDeposit: true,
                    insurance: true,
                    mutualFund: true,
                    realEstate: true,
                    saleDocuments: true,
                },
                orderBy: { created_at: 'desc' },
            }),
        ]);

        return {
            user,
            sales,
        };
    }

    async forgotPassword(dto: CommonDto) {
        const paylaod = decryptData(dto?.data);
        const user = await this.prisma.user.findUnique({
            where: {
                email: paylaod.email.toLowerCase(),
            },
        });
        if (!user?.email) {
            throw new BadRequestException(`Email address not found.`);
        } else {
            if (
                user?.auth_method !== 'EMAIL_OTP' &&
                user?.auth_method !== 'EMAIL_PW'
            ) {
                if (user?.auth_method === 'APPLE') {
                    throw new BadRequestException(
                        `Account created with 'Continue with Apple'`,
                    );
                } else if (user?.auth_method === 'GOOGLE') {
                    throw new BadRequestException(
                        `Account created with 'Continue with Google'`,
                    );
                }
            }

            const token = await generateRandomID(12);
            const expiry_minutes = 5;
            const expiry = new Date(Date.now() + expiry_minutes * 60 * 1000);
            await this.prisma.user.update({
                where: {
                    id: user?.id,
                },
                data: { reset_token: token, reset_token_exp: expiry },
            });

            const resetLink = `${this.config.get('WEB_BASE_PATH')}/admin/forgot-password?token=${token}`;
            setImmediate(async () => {
                try {
                    if (!user?.email) {
                        throw new BadRequestException(`Email address not found.`);
                    }
                    await this.mailService.sendResetPasswordEmail(
                        user?.email,
                        resetLink,
                        token,
                        expiry_minutes,
                    );
                } catch (error) {
                    console.error('Error sending email', error);
                }
            });
            return true;
        }
    }

    async resetPassword(dto: CommonDto) {
        const paylaod = decryptData(dto?.data);
        const user = await this.prisma.user.findFirst({
            where: {
                reset_token: paylaod.token,
                reset_token_exp: { gt: new Date() },
            },
        });

        if (!user) {
            return false;
        }

        const hashed = await bcrypt.hash(paylaod.new_password, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                reset_token: null,
                reset_token_exp: null,
            },
        });

        return true;
    }

    async TestEncryption(body: any) {
        try {
            return await encryptData(body);
        } catch (error) {
            throw error;
        }
    }

    async TestDecryption(body: any) {
        try {
            const data = await decryptData(body.data);
            return data;
        } catch (error) {
            throw error;
        }
    }

    private buildAgentDataReport(data: any) {
        const lines: string[] = [];
        const user = data?.user;
        const userName =
            `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'N/A';

        lines.push('===== DATA REPORT =====');
        lines.push('');

        lines.push('-- User Info --');
        lines.push(`Name: ${userName}`);
        lines.push(`Email: ${this.formatValue(user?.email)}`);
        lines.push(`Phone: ${this.formatValue(user?.phone_no)}`);
        lines.push(`Role: ${this.formatValue(user?.role?.name)}`);
        lines.push(`User ID: ${this.formatValue(user?.id)}`);
        lines.push('');

        lines.push('-- Profile Info --');
        lines.push(
            this.indentText(
                this.toJson({
                    status: user?.status,
                    auth_method: user?.auth_method,
                    onboarding_status: user?.onboardingStatus,
                    date_of_birth: user?.dob,
                    profile_image_path: user?.image,
                    country: user?.country,
                    currency: user?.currency,
                    created_at: user?.created_at,
                }),
                '   ',
            ),
        );
        lines.push('');

        lines.push('-- Agent KYC --');
        if (!user?.agentKYC) {
            lines.push('No KYC data found.');
        } else {
            lines.push(this.indentText(this.toJson(user.agentKYC), '   '));
        }
        lines.push('');

        this.appendCollectionSection(
            lines,
            'Organizations (Owned)',
            user?.organizations,
            (org: any) =>
                `${this.formatValue(org?.name)} [${this.formatValue(org?.id)}]`,
        );
        this.appendCollectionSection(
            lines,
            'Organization Memberships',
            user?.orgUsers,
            (membership: any) =>
                `${this.formatValue(membership?.organization?.name)} (${this.formatValue(membership?.role?.name)})`,
        );
        this.appendCollectionSection(
            lines,
            'Product Entities',
            user?.agentProductEntities,
            (item: any) =>
                `${this.formatValue(item?.productEntity?.products?.name)} -> ${this.formatValue(item?.productEntity?.name)}`,
        );
        this.appendCollectionSection(
            lines,
            'Customers',
            user?.customers,
            (customer: any) =>
                `${this.formatValue(customer?.first_name)} ${this.formatValue(customer?.last_name)} [${this.formatValue(customer?.id)}]`,
        );
        this.appendCollectionSection(
            lines,
            'Sales',
            data?.sales,
            (sale: any) =>
                `Sale ${this.formatValue(sale?.id)} - ${this.formatValue(sale?.productEntity?.name)} (${this.formatValue(sale?.status)})`,
        );
        this.appendCollectionSection(
            lines,
            'Meetings',
            user?.meetings,
            (meeting: any) =>
                `${this.formatValue(meeting?.title)} (${this.formatValue(meeting?.status)})`,
        );
        this.appendCollectionSection(
            lines,
            'ToDo',
            user?.toDos,
            (todo: any) =>
                `${this.formatValue(todo?.title)} (${this.formatValue(todo?.priority)})`,
        );
        this.appendCollectionSection(
            lines,
            'Notifications',
            user?.inAppNotifications,
            (note: any) =>
                `${this.formatValue(note?.title)} (${this.formatValue(note?.type)})`,
        );

        lines.push('===== END OF REPORT =====');
        return lines.join('\n');
    }

    private appendCollectionSection(
        lines: string[],
        title: string,
        items: any[] | null | undefined,
        itemHeader: (item: any) => string,
    ) {
        lines.push(`-- ${title} --`);
        if (!items?.length) {
            lines.push(`No ${title.toLowerCase()} found.`);
            lines.push('');
            return;
        }

        items.forEach((item, index) => {
            lines.push(`${index + 1}. ${itemHeader(item)}`);
            lines.push(this.indentText(this.toJson(item), '   '));
        });
        lines.push('');
    }

    private formatValue(value: any) {
        if (value === undefined || value === null || value === '') {
            return 'N/A';
        }
        if (typeof value === 'bigint') {
            return value.toString();
        }
        return String(value);
    }

    private formatDate(value: any) {
        if (!value) {
            return 'N/A';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return this.formatValue(value);
        }
        return date.toISOString();
    }

    private toJson(value: any) {
        return JSON.stringify(
            value,
            (key, item) => {
                if (key === 'updated_at' || key === 'updatedAt') {
                    return undefined;
                }
                return typeof item === 'bigint' ? item.toString() : item;
            },
            2,
        );
    }

    private indentText(text: string, indent: string) {
        return text
            .split('\n')
            .map((line) => `${indent}${line}`)
            .join('\n');
    }

    private buildDeletedFieldValue(
        value: string | null | undefined,
        suffix: string,
    ) {
        if (!value) {
            return null;
        }

        return `deleted_${suffix}_${value}`;
    }
}
