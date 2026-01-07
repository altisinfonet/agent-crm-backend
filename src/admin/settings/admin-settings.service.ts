import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { decryptData, encryptData } from '@/common/helper/common.helper';
import { CommonDto } from 'src/auth/dto/common.dto';

@Injectable()
export class AdminSettingsService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(createAdminSettingDto: CommonDto) {
    const decryptedPayload = decryptData(createAdminSettingDto?.data)
    try {
      const find = await this.prisma.adminSettings.count({
        where: {
          title: decryptedPayload.title,
        }
      })
      if (find) {
        throw new BadRequestException("Duplicate setting title.")
      }
      const setting = await this.prisma.adminSettings.create({
        data: {
          title: decryptedPayload.title,
          metadata: decryptedPayload.metadata
        }
      })
      return setting
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const setting = await this.prisma.adminSettings.findMany({
        select: {
          id: true,
          title: true,
          metadata: true,
          created_at: true,
          updated_at: true
        }
      })

      return setting
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} adminSetting`;
  }

  async update(setting_id: bigint, updateAdminSettingDto: CommonDto) {
    const decryptedPayload = decryptData(updateAdminSettingDto?.data)
    try {
      const setting = await this.prisma.adminSettings.update({
        where: {
          id: setting_id
        },
        data: {
          title: decryptedPayload.title,
          metadata: decryptedPayload.metadata
        }
      })
      return setting
    } catch (error) {
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} adminSetting`;
  }
}
