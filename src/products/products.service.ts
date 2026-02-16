import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData } from '@/common/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { R2Service } from '@/common/helper/r2.helper';


@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    try {
      const products = await this.prisma.products.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          desc: true,
          image: true,
          created_at: true,
        },
      });

      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          let image = product.image;

          if (image) {
            image = await R2Service.getSignedUrl(image);
          }

          return {
            ...product,
            image,
          };
        }),
      );

      return updatedProducts;
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
                desc: true,
                image: true,
              },
            },
          },
        }),
        this.prisma.productEntity.count({ where }),
      ]);

      if (!entities.length) {
        return {
          Product: {
            id: product_id,
            name: null,
            desc: null,
            image: null,
            entities: [],
          },
          Total: 0,
        };
      }

      const { products } = entities[0];
      let productImage = products.image;
      if (productImage) {
        productImage = await R2Service.getSignedUrl(productImage);
      }
      const updatedEntities = await Promise.all(
        entities.map(async ({ products, ...entity }) => {
          let image = entity.image;

          if (image) {
            image = await R2Service.getSignedUrl(image);
          }

          return {
            ...entity,
            image,
          };
        }),
      );

      return {
        Product: {
          id: products.id,
          name: products.name,
          desc: products.desc,
          image: productImage,
          entities: updatedEntities,
        },
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }

  async create(agent_id: bigint, entity_id: bigint) {
    try {
      const findEntity = await this.prisma.productEntity.count({
        where: {
          id: entity_id
        }
      })
      if (!findEntity) {
        throw new BadRequestException("Product entity not found")
      }
      const findAgentEntity = await this.prisma.agentProductEntity.count({
        where: {
          agent_id,
          product_entity_id: entity_id
        }
      })
      if (findAgentEntity) {
        throw new BadRequestException("Duplicate entity not allowed")
      }
      const agentEntity = await this.prisma.agentProductEntity.create({
        data: {
          agent_id,
          product_entity_id: entity_id
        }
      })
      return agentEntity;
    } catch (error) {
      throw error;
    }
  }

  async findAllAgentProductEntityList(agent_id: bigint) {
    try {
      const agentProductEntity =
        await this.prisma.agentProductEntity.findMany({
          where: { agent_id },
          orderBy: {
            created_at: "desc"
          },
          select: {
            id: true,
            productEntity: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                products: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

      // const groupedData = Object.values(
      //   agentProductEntity.reduce((acc, item) => {
      //     const product = item.productEntity.products;
      //     const entity = item.productEntity;

      //     const productKey = product.id.toString();

      //     if (!acc[productKey]) {
      //       acc[productKey] = {
      //         id: item.id,
      //         product: {
      //           id: product.id.toString(),
      //           name: product.name,
      //           slug: product.slug,
      //           status: product.status,
      //           entities: [],
      //         },
      //       };
      //     }

      //     acc[productKey].product.entities.push({
      //       id: entity.id.toString(),
      //       name: entity.name,
      //       slug: entity.slug,
      //       status: entity.status,
      //     });

      //     return acc;
      //   }, {} as Record<string, any>)
      // );
      // return groupedData;
      return agentProductEntity;
    } catch (error) {
      throw error;
    }
  }

  async remove(agent_id: bigint, agent_product_entity_id: bigint) {
    try {
      const findEntity = await this.prisma.agentProductEntity.findFirst({
        where: {
          id: agent_product_entity_id,
          agent_id
        }
      })
      if (!findEntity) {
        throw new BadRequestException("Agent product entity not found")
      }
      const removeAgentEntity = await this.prisma.agentProductEntity.delete({
        where: {
          id: findEntity?.id,
        }
      })
      return true;
    } catch (error) {
      throw error
    }
  }
}
