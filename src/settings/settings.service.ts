import { Injectable } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
  ) { }
  create(createSettingDto: CommonDto) {
    return 'This action adds a new setting';
  }

  async paymentSettings(setting: string) {
    try {
      const admin_settings = await this.prisma.adminSettings.findFirst({
        where: {
          title: setting,
        }
      })
      const {
        razorpayid,
        razorpaysecretkey
      } = admin_settings?.metadata as Record<string, any> || {};
      const payment_settings = {
        RAZORPAY_KEY_ID: razorpayid,
        RAZORPAY_KEY_SECRET: razorpaysecretkey
      }

      return payment_settings;
    } catch (error) {
      throw error
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} setting`;
  }

  update(id: number, updateSettingDto: CommonDto) {
    return `This action updates a #${id} setting`;
  }

  remove(id: number) {
    return `This action removes a #${id} setting`;
  }
}
