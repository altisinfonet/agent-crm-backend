import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData, generateSlug } from '@/common/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { R2Service } from '@/common/helper/r2.helper';


@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async updateProducts(product_id: bigint, dto: CommonDto, file?: { key?: string },) {
    try {
      const payload = decryptData(dto.data);
      const dataToUpdate: any = {};

      if (payload?.delete === true) {
        dataToUpdate.image = null;
      } else if (file?.key) {
        dataToUpdate.image = file.key;
      }

      if (
        typeof payload?.desc === 'string' &&
        payload.desc.trim().length > 0
      ) {
        dataToUpdate.desc = payload.desc.trim();
      }

      if (
        typeof payload?.status === 'string' &&
        payload.status.trim().length > 0
      ) {
        dataToUpdate.status = payload.status;
      }

      const res = await this.prisma.products.update({
        where: { id: product_id },
        data: dataToUpdate,
      });

      return res;
    } catch (error) {
      throw error;
    }
  }

  async findById(id: bigint) {
    return this.prisma.products.findUnique({
      where: { id },
      select: { image: true },
    });
  }

  async findAllProducts() {
    try {
      const products = await this.prisma.products.findMany({
        orderBy: {
          id: "desc"
        },
        select: {
          id: true,
          name: true,
          slug: true,
          desc: true,
          image: true,
          status: true,
          created_at: true,
          _count: {
            select: {
              entities: true,
            },
          },
          entities: {
            orderBy: {
              id: "desc"
            },
            select: {
              id: true,
              name: true,
              slug: true,
              desc: true,
              image: true,
              status: true,
              created_at: true,
            },
          },
        },
      });

      const result = await Promise.all(
        products.map(async (product) => ({
          ...product,
          image: product.image
            ? await R2Service.getSignedUrl(product.image)
            : null,
          entities: await Promise.all(
            product.entities.map(async (entity) => ({
              ...entity,
              image: entity.image
                ? await R2Service.getSignedUrl(entity.image)
                : null,
            })),
          ),
        })),
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  async create(product_id: bigint, dto: CommonDto, file?: { image?: string },) {
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
          desc: payload?.desc,
          image: file?.image ?? null,
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

      if (!entities.length) {
        return {
          Product: null,
          Total: 0,
        };
      }

      const { products } = entities[0];

      const transformedEntities = await Promise.all(
        entities.map(async ({ products, ...entity }) => ({
          ...entity,
          image: entity.image
            ? await R2Service.getSignedUrl(entity.image)
            : null,
        })),
      );

      return {
        Product: {
          id: products.id,
          name: products.name,
          entities: transformedEntities,
        },
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }


  async findEntityById(id: bigint) {
    return this.prisma.productEntity.findUnique({
      where: { id },
      select: { image: true },
    });
  }
  async updateEntity(
    id: bigint,
    updateEntityDto: CommonDto,
    file?: { image?: string },
  ) {
    try {
      const payload = decryptData(updateEntityDto.data);
      const entity = await this.prisma.productEntity.findUnique({
        where: { id },
      });

      if (!entity) {
        throw new NotFoundException('Entity not found');
      }
      const dataToUpdate: any = {};

      if (
        typeof payload?.name === 'string' &&
        payload.name.trim() &&
        payload.name !== entity.name
      ) {
        let baseSlug = await generateSlug(
          payload.name,
          this.prisma.productEntity,
          'slug',
        );

        let slug = baseSlug;
        let counter = 1;

        while (
          await this.prisma.productEntity.findUnique({ where: { slug } })
        ) {
          slug = `${baseSlug}-${counter++}`;
        }

        dataToUpdate.name = payload.name.trim();
        dataToUpdate.slug = slug;
      }

      if (typeof payload?.desc === 'string') {
        dataToUpdate.desc = payload.desc.trim();
      }

      if (payload?.status !== undefined) {
        dataToUpdate.status = payload.status;
      }

      if (file?.image !== undefined) {
        dataToUpdate.image = file.image;
      }

      return await this.prisma.productEntity.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (error) {
      throw error;
    }
  }


  async remove(id: bigint) {
    const entity = await this.prisma.productEntity.findUnique({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Product entity not found');
    }

    const associationCount =
      await this.prisma.agentProductEntity.count({
        where: {
          product_entity_id: id,
        },
      });

    if (associationCount > 0) {
      throw new BadRequestException('This product entity is associated with one or more agents and cannot be deleted.',);
    }

    await this.prisma.productEntity.delete({
      where: { id },
    });

    return true;
  }

}
