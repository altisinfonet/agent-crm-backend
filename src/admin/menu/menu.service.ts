import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData, generateSlug } from '@/common/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
  ) { }
  async create(createMenuDto: CommonDto) {
    try {
      const payload = decryptData(createMenuDto.data);
      console.log("payload", payload);

      const foundMenuType = await this.prisma.menuType.findFirst({
        where: {
          id: payload.menu_type_id
        },
      })
      if (!foundMenuType) {
        throw new NotFoundException("Menu type not found")
      }
      const lastRank = await this.prisma.menu.findFirst({
        where: {
          menu_type_id: payload.menu_type_id
        },
        orderBy: {
          id: "desc"
        },
        select: {
          display_rank: true,
        }
      })

      const rank = Number(lastRank?.display_rank ?? 0) + 1;

      const menu = await this.prisma.menu.create({
        data: {
          menu_type_id: payload.menu_type_id,
          menu_item_id: payload.menu_item_id,
          menu_item_type: payload.menu_item_type,
          path: payload.path,
          display_rank: rank
        }
      })
      return menu;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const menus = await this.prisma.menuType.findMany({
        where: {
          parent_menu_type: null
        },
        orderBy: {
          id: 'asc'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          menu: {
            where: {
              status: "ACTIVE",
            },
            orderBy: {
              display_rank: "asc"
            },
            select: {
              id: true,
              menu_item_id: true,
              menu_item_type: true,
              display_rank: true,
              path: true,
            }
          },
          sub_menu_types: {
            orderBy: {
              id: 'asc'
            },
            select: {
              id: true,
              name: true,
              slug: true,
              menu: {
                where: {
                  status: "ACTIVE",
                },
                orderBy: {
                  display_rank: "asc"
                },
                select: {
                  id: true,
                  menu_item_id: true,
                  menu_item_type: true,
                  display_rank: true,
                  path: true,
                }
              }
            }
          },
        }
      });
      return menus;
    } catch (error) {
      throw error
    }
  }

  async createMenuType(createMenuTypeDto: CommonDto) {
    try {
      const payload = decryptData(createMenuTypeDto.data);
      console.log("payload", payload);

      const categorySlug = await generateSlug(
        payload.name,
        this.prisma.menuType,
        'slug'
      );
      let parent_menu_type: bigint | null = null;
      if (payload.parent_id !== undefined && payload.parent_id !== null) {
        parent_menu_type = BigInt(payload.parent_id);
        const existingSub = await this.prisma.menuType.findFirst({
          where: {
            name: payload.name,
            parent_menu_type: parent_menu_type,
          },
        });
        if (existingSub) {
          throw new BadRequestException(`Submenu type with name "${payload.name}" already exists.`);
        }
      }
      else {
        const existingParent = await this.prisma.menuType.findFirst({
          where: {
            name: payload.name,
            parent_menu_type: null,
          },
        });

        if (existingParent) {
          throw new BadRequestException(`Menu type with name "${payload.name}" already exists.`);
        }
      }
      const menuType = await this.prisma.menuType.create({
        data: {
          name: payload.name,
          slug: categorySlug,
          parent_menu_type: parent_menu_type,
        },
      });
      return menuType;
    }
    catch (error) {
      throw error;
    }
  }

  async findAllMenuType(getAllMenuTypeDto: CommonDto) {
    try {
      const payload = decryptData(getAllMenuTypeDto.data);
      let conditions: any[] = [];
      let searchWord = '';

      if (payload?.search) {
        let str = (payload?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { name: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }
      if (payload?.parent) {
        conditions.push({
          parent_menu_type: null
        });
      }


      let menuType: any;
      if (payload && payload?.page && payload?.limit) {
        menuType = await this.prisma.menuType.findMany({
          skip: (payload?.page - 1) * payload?.limit,
          take: payload?.limit,
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            name: true,
            slug: true,
            sub_menu_types: {
              orderBy: {
                id: 'desc'
              },
              select: {
                id: true,
                name: true,
                slug: true,
                parent_menu_type: true,
              }
            },
          }
        });
      } else {
        menuType = await this.prisma.menuType.findMany({
          where: {
            AND: conditions
          },
          orderBy: {
            id: 'desc'
          },
          select: {
            id: true,
            name: true,
            slug: true,
            sub_menu_types: {
              orderBy: {
                id: 'desc'
              },
              select: {
                id: true,
                name: true,
                slug: true,
                parent_menu_type: true,
              }
            },
          }
        });
      }
      const totalCount = await this.prisma.menuType.count({
        where: {
          AND: conditions,
        },
      });

      return { Total: totalCount, MenuTypes: menuType };
    } catch (error) {
      throw error;
    }
  }


  async findOneMenuType(menu_type: string) {
    try {
      const menuType = await this.prisma.menuType.findUnique({
        where: {
          slug: menu_type
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sub_menu_types: {
            orderBy: {
              id: 'desc'
            },
            select: {
              id: true,
              name: true,
              slug: true,
              parent_menu_type: true,
            }
          },
        }
      });
      return menuType;
    } catch (error) {
      throw error;
    }
  }

  async update(updateMenuTypeDto: CommonDto, menu_id?: bigint) {
    try {
      const payload = decryptData(updateMenuTypeDto.data);
      const lastRank = await this.prisma.menu.findFirst({
        where: {
          menu_type_id: payload.menu_type_id
        },
        orderBy: {
          id: "desc"
        },
        select: {
          display_rank: true,
        }
      })
      const rank = Number(lastRank?.display_rank ?? 0) + 1;
      if (menu_id) {
        const menu = await this.prisma.menu.update({
          where: {
            id: menu_id
          },
          data: {
            menu_type_id: payload.menu_type_id,
            menu_item_id: payload.menu_item_id,
            menu_item_type: payload.menu_item_type,
            status: payload?.status,
            path: payload.path,
            display_rank: rank
          }
        })
        return menu
      } else {
        const menu = await this.prisma.menu.create({
          data: {
            menu_type_id: payload?.menu_type_id!,
            menu_item_id: payload?.menu_item_id!,
            menu_item_type: payload?.menu_item_type || "",
            path: payload?.path || "",
            display_rank: rank
          }
        })
        return menu
      }
    } catch (error) {
      throw error;
    }
  }

  async remove(menu_id: bigint) {
    try {
      const delMenu = await this.prisma.menu.delete({
        where: {
          id: menu_id
        }
      })
      return delMenu;
    } catch (error) {
      throw error;
    }
  }


  async updateType(menu_type_id: bigint, updateMenuTypeDto: CommonDto) {
    try {
      const payload = decryptData(updateMenuTypeDto.data);
      const existingCategory = await this.prisma.menuType.findUnique({
        where: { id: menu_type_id },
      });

      if (
        payload.name &&
        payload.name.toLowerCase() !== existingCategory?.name.toLowerCase()
      ) {
        if (existingCategory?.parent_menu_type === null) {
          const duplicateParent = await this.prisma.menuType.findFirst({
            where: {
              name: payload.name,
              parent_menu_type: null,
              NOT: { id: menu_type_id },
            },
          });

          if (duplicateParent) {
            throw new BadRequestException(
              `Menu with name "${payload.name}" already exists.`
            );
          }
        } else {
          const duplicateSub = await this.prisma.menuType.findFirst({
            where: {
              name: payload.name,
              parent_menu_type: existingCategory?.parent_menu_type,
              NOT: { id: menu_type_id },
            },
          });

          if (duplicateSub) {
            throw new BadRequestException(
              `Category with name "${payload.name}" already exists.`
            );
          }
        }
      }

      let newSlug = existingCategory?.slug;
      if (payload.name && payload.name !== existingCategory?.name) {
        newSlug = await generateSlug(
          payload.name,
          this.prisma.menuType,
          'slug'
        );
      }
      const updateData: any = {};

      if (payload.name !== undefined) {
        updateData.name = payload.name;
      }

      const menuType = await this.prisma.menuType.update({
        where: { id: menu_type_id },
        data: updateData,
      });
      return menuType
    } catch (error) {
      throw error;
    }
  }


  async removeType(menu_type_id: bigint) {
    try {
      const menuType = await this.prisma.menuType.delete({
        where: { id: menu_type_id },
      });
      return menuType
    } catch (error) {
      throw error;
    }
  }
}
