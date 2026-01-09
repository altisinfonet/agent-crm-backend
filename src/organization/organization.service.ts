import { decryptData } from '@/common/helper/common.helper';
import { Injectable } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationService {
    constructor(
        private prisma: PrismaService,
    ) { }
    create(createOrganizationDto: CommonDto) {
        return 'This action adds a new setting';
    }

    async findOne(agent_id: bigint) {
        try {
            const org = await this.prisma.organization.findUnique({
                where: {
                    created_by: agent_id
                },
                select: {
                    id: true,
                    name: true,
                    contact_email: true,
                    contact_phone: true,
                    gst_number: true,
                    pan_number: true,
                    status: true,
                    created_at: true,
                    updated_at: true,
                    users: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    id: true,
                                    first_name: true,
                                    last_name: true,
                                    email: true,
                                    phone_no: true,
                                    role: {
                                        select: {
                                            id: true,
                                            name: true,
                                        }
                                    },
                                    image: true,
                                    status: true,
                                }
                            },
                            created_at: true
                        }
                    }
                }
            })
            return org;
        } catch (error) {
            throw error;
        }
    }

    async update(id: bigint, agent_id: bigint, updateProductDto: CommonDto) {
        try {
            const payload = decryptData(updateProductDto.data);
            const org = await this.prisma.organization.update({
                where: {
                    id,
                    created_by: agent_id
                },
                data: {
                    name: payload?.name,
                    gst_number: payload?.gst_number,
                    pan_number: payload?.pan_number,
                    contact_email: payload?.contact_email,
                    contact_phone: payload?.contact_phone,
                },
                select: {
                    id: true,
                    name: true,
                    gst_number: true,
                    pan_number: true,
                    contact_email: true,
                    contact_phone: true,
                    created_at: true,
                    updated_at: true
                }
            })
            return org;
        } catch (error) {
            throw error;
        }
    }

    remove(id: number) {
        return `This action removes a #${id} setting`;
    }
}
