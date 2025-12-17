import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { createMetaData, decryptData, generateSlug } from 'src/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(product_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const existingEntity = await this.prisma.productEntity.findFirst({
        where: {
          name: {
            equals: payload.name,
            mode: 'insensitive',
          },
        },
      });
      if (existingEntity) {
        throw new BadRequestException(`Entity '${payload.name}' already exists`);
      }

      const enetitySlug = await generateSlug(
        payload.name,
        this.prisma.productEntity,
        'slug'
      );

      let slug = enetitySlug;
      let counter = 1;

      while (await this.prisma.productEntity.findUnique({ where: { slug } })) {
        slug = `${enetitySlug}-${counter++}`;
      }

      const newEntity = await this.prisma.productEntity.create({
        data: {
          name: payload.name,
          slug,
          product_id,
          status: "ACTIVE",
        },
      });

      return newEntity;
    } catch (error) {
      throw error;
    }
  };

  async findAll(product_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const page = Number(payload.page || 1);
      const limit = Number(payload.limit || 10);
      const skip = (page - 1) * limit;

      const where: any = {
        product_id,
        status: payload.status,
        ...(payload.search && {
          name: {
            contains: payload.search,
            mode: 'insensitive',
          },
          slug: {
            contains: payload.search,
            mode: 'insensitive',
          },
        }),
      };

      const [data, total] = await Promise.all([
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

      return {
        Entities: data,
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }


  async update(id: bigint, updateEntityDto: CommonDto) {
    try {
      const payload = decryptData(updateEntityDto.data);
      const entity = await this.prisma.productEntity.findUnique({
        where: { id },
      });

      if (!entity) {
        throw new NotFoundException(`Entity not found`);
      }

      let slug = entity.slug;
      if (payload.name && payload.name !== entity.name) {
        const entitySlug = await generateSlug(
          payload.name,
          this.prisma.productEntity,
          'slug'
        );

        slug = entitySlug;
        let counter = 1;

        while (
          await this.prisma.productEntity.findUnique({
            where: { slug },
          })
        ) {
          slug = `${entitySlug}-${counter++}`;
        }
      }
      const updated = await this.prisma.productEntity.update({
        where: { id },
        data: {
          name: payload.name ?? entity.name,
          slug,
          status: payload.status,
        },
      });

      return updated
    } catch (error) {
      throw error;
    }
  }


  async remove(id: bigint) {
    try {
      const entity = await this.prisma.productEntity.findUnique({
        where: { id },
      });

      if (!entity) {
        throw new NotFoundException('Product entity not found');
      }

      await this.prisma.productEntity.delete({
        where: { id },
      });

      return null;
    } catch (error) {
      throw error;
    }
  }
}
