import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { decryptData } from 'src/helper/common.helper';
import { CommonDto } from 'src/auth/dto/common.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CurrencyService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);

      const exists = await this.prisma.currency.count({
        where: { code: payload.code },
      });

      if (exists) {
        throw new BadRequestException('Duplicate currency code');
      }

      return await this.prisma.currency.create({
        data: {
          name: payload.name,
          code: payload.code,
          symbol: payload.symbol,
          exchange_rate: payload.exchange_rate ?? 0,
        },
      });
    } catch (error) {
      throw error
    }
  }

  async findAll(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);

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
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, data] = await this.prisma.$transaction([
        this.prisma.currency.count({ where }),
        this.prisma.currency.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
      ]);

      return {
        Currency: data,
        Total: total,
      };
    } catch (error) {
      throw error
    }
  }

  async findOne(id: bigint) {
    try {
      const currency = await this.prisma.currency.findUnique({
        where: { id },
      });

      if (!currency) {
        throw new NotFoundException('Currency not found');
      }

      return currency;
    } catch (error) {
      throw error
    }
  }

  async update(id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);

      const currency = await this.prisma.currency.findUnique({
        where: { id },
      });

      if (!currency) {
        throw new NotFoundException('Currency not found');
      }

      if (payload.code) {
        const exists = await this.prisma.currency.count({
          where: {
            code: payload.code,
            NOT: { id },
          },
        });

        if (exists) {
          throw new BadRequestException('Duplicate currency code');
        }
      }

      return await this.prisma.currency.update({
        where: { id },
        data: {
          name: payload.name ?? currency.name,
          code: payload.code ?? currency.code,
          symbol: payload.symbol ?? currency.symbol,
          exchange_rate:
            payload.exchange_rate ?? currency.exchange_rate,
          status: payload.status ?? currency.status,
        },
      });
    } catch (error) {
      throw error
    }
  }

  async remove(id: bigint) {
    try {
      const currency = await this.prisma.currency.findUnique({
        where: { id },
      });

      if (!currency) {
        throw new NotFoundException('Currency not found');
      }
      await this.prisma.currency.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      throw error
    }
  }
}

