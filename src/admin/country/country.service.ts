import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData } from '@/common/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CountryService {
  constructor(
    private prisma: PrismaService,
  ) { }

  private parseTimezone(timezones: Record<string, string>) {
    const [timezone, offset] = Object.entries(timezones)[0];

    const sign = offset.startsWith('-') ? -1 : 1;
    const [hours, minutes] = offset.replace('+', '').replace('-', '').split(':');

    const utc_offset_min =
      sign * (Number(hours) * 60 + Number(minutes));

    return {
      timezone,
      utc_offset_min,
    };
  }


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

  async bulkCreate(createCountryDto: CommonDto) {
    try {
      const { data: payload } = decryptData(createCountryDto.data)

      if (!Array.isArray(payload) || !payload.length) {
        throw new BadRequestException('Invalid payload');
      }
      const mappedCountries = payload.map((item) => {
        const { timezone, utc_offset_min } = this.parseTimezone(item.timezones);
        const phoneLength = Array.isArray(item.phoneLength)
          ? item.phoneLength[0]
          : item.phoneLength ?? null;
        return {
          name: item.name,
          iso_code: item.iso?.['alpha-2'],
          phone_code: item.phone?.[0] ?? null,
          region: item.region,
          phoneLength,
          timezone,
          utc_offset_min,
          image: item.emoji,
        };
      }).filter(c => c.iso_code);

      const uniqueMap = new Map();
      for (const c of mappedCountries) {
        uniqueMap.set(c.iso_code, c);
      }
      const uniqueCountries = [...uniqueMap.values()];

      const existing = await this.prisma.country.findMany({
        where: {
          iso_code: {
            in: uniqueCountries.map(c => c.iso_code),
          },
        },
        select: { iso_code: true },
      });

      const existingCodes = new Set(existing.map(e => e.iso_code));
      const finalInsert = uniqueCountries.filter(
        c => !existingCodes.has(c.iso_code),
      );
      if (!finalInsert.length) {
        return {
          inserted: 0,
          skipped: uniqueCountries.length,
        };
      }

      await this.prisma.country.createMany({
        data: finalInsert,
        skipDuplicates: true,
      });

      return {
        inserted: finalInsert.length,
        skipped: uniqueCountries.length - finalInsert.length,
      };
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
