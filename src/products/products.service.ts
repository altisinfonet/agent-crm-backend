import { Injectable } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData } from 'src/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    try {
      const products = await this.prisma.products.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          created_at: true
        }
      })
      return products;
    } catch (error) {
      throw error;
    }
  }

  async findOne(product_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const page = Number(payload.page || 1);
      const limit = Number(payload.limit || 10);
      const skip = (page - 1) * limit;

      const where: any = {
        product_id,
        ...(payload.status && { status: payload.status }),
        ...(payload.search && {
          OR: [
            {
              name: {
                contains: payload.search,
                mode: 'insensitive',
              },
            },
            {
              slug: {
                contains: payload.search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      };

      const [entities, total] = await Promise.all([
        this.prisma.productEntity.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            products: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.productEntity.count({ where }),
      ]);
      const { products } = entities[0];

      if (!entities.length) {
        return {
          Product: {
            id: products.id,
            name: products.name,
            entities: [],
          },
          Total: 0,
        };
      }

      return {
        Product: {
          id: products.id,
          name: products.name,
          entities: entities.map(({ products, ...entity }) => entity),
        },
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }


  update(id: number, updateProductDto: CommonDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
