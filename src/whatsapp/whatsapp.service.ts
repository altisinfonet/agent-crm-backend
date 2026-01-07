import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { PrismaService } from '@/prisma/prisma.service';
import axios from "axios";

@Injectable()
export class WhatsappService {
  constructor(
    private prisma: PrismaService,
  ) { }

  private async fetchWhatsappCredentials() {
    try {
      const setting = await this.prisma.adminSettings.findFirst({
        where: { title: "whatsapp-settings" },
      });

      if (!setting) {
        throw new BadRequestException("WhatsApp settings not found");
      }

      const {
        apiUrl,
        phone_number_id,
        apiKey,
      } = setting.metadata as Record<string, string>;

      if (!apiUrl || !phone_number_id || !apiKey) {
        throw new BadRequestException("WhatsApp configuration is incomplete");
      }
      const finalApiUrl = apiUrl.replace(/{{(\w+)}}/g, (_, key) => {
        if (key === "phone_number_id") return phone_number_id;
        throw new BadRequestException(`Unknown URL param: ${key}`);
      });

      return {
        apiUrl: finalApiUrl,
        apiKey,
      };
    } catch (error) {
      throw error;
    }
  }


  async sendOtp(payload: { phone: string, otp: string }) {
    try {
      const { apiUrl, apiKey } = await this.fetchWhatsappCredentials();
      const whatsappPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: `91${payload?.phone}`,
        type: "template",
        template: {
          name: "send_otp",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: `${payload?.otp}`
                }
              ]
            },
            {
              type: "button",
              sub_type: "COPY_CODE",
              index: 0,
              parameters: [
                {
                  type: "coupon_code",
                  coupon_code: `${payload?.otp}`
                }
              ]
            }
          ]
        }
      }
      const sendOtp = await axios.post(apiUrl, whatsappPayload, {
        headers: {
          apikey: apiKey,
          "Content-Type": "application/json",
        },
      });

      return true;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }


  findAll() {
    return `This action returns all whatsapp`;
  }

  findOne(id: number) {
    return `This action returns a #${id} whatsapp`;
  }

  update(id: number, updateWhatsappDto: CommonDto) {
    return `This action updates a #${id} whatsapp`;
  }

  remove(id: number) {
    return `This action removes a #${id} whatsapp`;
  }
}
