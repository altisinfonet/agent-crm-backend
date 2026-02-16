import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData } from '@/common/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CountryService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(createCountryDto: CommonDto) {
    const decryptedPayload = decryptData(createCountryDto?.data)
    try {
      const find = await this.prisma.country.count({
        where: {
          iso_code: decryptedPayload.iso_code,
        }
      })
      if (find) {
        throw new BadRequestException("Duplicate country code.")
      }
      const setting = await this.prisma.country.create({
        data: {
          name: decryptedPayload.name,
          iso_code: decryptedPayload.iso_code,
          phone_code: decryptedPayload.phone_code,
          region: decryptedPayload.region,
          phoneLength: decryptedPayload.phoneLength,
          timezone: decryptedPayload.timezone,
          utc_offset_min: decryptedPayload.utc_offset_min,
          image: decryptedPayload.image
        }
      })
      return setting
    } catch (error) {
      throw error;
    }
  }

  async findAll(commonDto: CommonDto) {
    const payload = decryptData(commonDto.data);

    const page = Number(payload.page) || 1;
    const limit = Number(payload.limit) || 10;
    const search = payload.search?.trim();
    const status = payload.status?.trim();

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          iso_code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone_code: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.country.count({ where }),
      this.prisma.country.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    return {
      Country: data,
      Total: total
    };
  }


  async findOne(id: bigint) {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    return country;
  }


  async update(id: bigint, updateCountryDto: CommonDto) {
    try {

      const payload = decryptData(updateCountryDto.data);

      const country = await this.prisma.country.findUnique({
        where: { id },
      });

      if (!country) {
        throw new NotFoundException('Country not found');
      }

      if (payload.iso_code) {
        const exists = await this.prisma.country.count({
          where: {
            iso_code: payload.iso_code,
            NOT: { id },
          },
        });

        if (exists) {
          throw new BadRequestException('Duplicate country code');
        }
      }

      const update = await this.prisma.country.update({
        where: { id },
        data: {
          ...(payload.name && { name: payload.name }),
          ...(payload.iso_code && { iso_code: payload.iso_code }),
          ...(payload.phone_code !== undefined && {
            phone_code: payload.phone_code,
          }),
          ...(payload.phoneLength && { phoneLength: payload.phoneLength }),
          ...(payload.timezone && { timezone: payload.timezone }),
          ...(payload.utc_offset_min && { utc_offset_min: payload.utc_offset_min }),
          ...(payload.image && { image: payload.image }),
          ...(payload.status && { status: payload.status }),
        },
      });

      return update;
    } catch (error) {
      throw error
    }
  }

  async remove(id: bigint) {
    const country = await this.prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException('Country not found');
    }

    await this.prisma.country.delete({
      where: { id },
    });

    return true;
  }
}
