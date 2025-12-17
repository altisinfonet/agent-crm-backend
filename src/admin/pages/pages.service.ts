import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { createMetaData, decryptData, generateSlug } from 'src/helper/common.helper';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const existingPage = await this.prisma.dynamicPage.findFirst({
        where: {
          title: {
            equals: payload.title,
            mode: 'insensitive',
          },
        },
      });
      if (existingPage) {
        throw new BadRequestException(`Page '${payload.title}' already exists`);
      }

      const pageSlug = await generateSlug(
        payload.title,
        this.prisma.dynamicPage,
        'slug'
      );


      // 2. Ensure uniqueness (append number if duplicate)
      let slug = pageSlug;
      let counter = 1;

      while (await this.prisma.dynamicPage.findUnique({ where: { slug } })) {
        slug = `${pageSlug}-${counter++}`;
      }

      // 3. Create the page
      const newPage = await this.prisma.dynamicPage.create({
        data: {
          title: payload.title,
          slug,
          description: payload.description || "",
          isActive: payload.isActive ?? true,
        },
      });

      if (newPage) {
        let metaDetails = {
          meta_title: payload?.meta_title,
          meta_description: payload?.meta_description,
          meta_keyword: payload?.meta_keyword,
          other_meta: payload.other_meta
        }
        await createMetaData(
          newPage.id,
          "page",
          "_page_meta",
          JSON.stringify(metaDetails)
        )
      }

      return {
        message: "Dynamic page created successfully",
        data: newPage,
      };
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to create dynamic page");
    }
  };

  async getAllDynamicPages(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { page = 1, limit = 10, search } = payload;

      // Search filter (title or description)
      const searchFilter: any = search
        ? {
          OR: [
            { title: { contains: search.trim(), mode: "insensitive" } },
            { description: { contains: search.trim(), mode: "insensitive" } },
          ],
        }
        : {};

      // Run in a transaction for efficiency (get data + total count together)
      const [pages, totalCount] = await this.prisma.$transaction([
        this.prisma.dynamicPage.findMany({
          where: searchFilter,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: "desc" }, // default sorting by newest
        }),
        this.prisma.dynamicPage.count({
          where: searchFilter,
        }),
      ]);

      return {
        Pages: pages,
        Total: totalCount,
      };
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to get dynamic pages");
    }
  }



  async getDynamicPage(slug: string) {
    try {
      const existingPage = await this.prisma.dynamicPage.findUnique({
        where: { slug, isActive: true }
      });
      if (!existingPage) {
        throw new NotFoundException(`Page not found`);
      }

      const meta = await this.prisma.metaData.findFirst({
        where: {
          table_id: existingPage?.id,
          table_name: "page",
          key: "_page_meta",
        }
      });

      (existingPage as any).meta_data = meta?.value ? JSON.parse(meta?.value) : ""

      const inFooter = await this.prisma.menu.findFirst({
        where: {
          menu_item_type: "page",
          menu_item_id: existingPage?.id,
        },
        select: {
          id: true,
          menu_type_id: true,
        }
      })
      if (!existingPage) {
        throw new BadRequestException(`Page '${slug}' not found`);
      }
      (existingPage as any).isInFooter = !!inFooter;
      (existingPage as any).menu_id = inFooter?.id;
      (existingPage as any).menu_type_id = inFooter?.menu_type_id;
      return existingPage;
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to get dynamic page");
    }
  };



  async updateDynamicPage(id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      // 1. Find the existing page
      const existingPage = await this.prisma.dynamicPage.findUnique({
        where: { id },
      });

      if (!existingPage) {
        throw new NotFoundException(`Page not found`);
      }

      // 2. Handle slug regeneration if title is updated
      let slug = existingPage.slug;
      if (payload.title && payload.title !== existingPage.title) {
        const pageSlug = await generateSlug(
          payload.title,
          this.prisma.dynamicPage,
          'slug'
        );

        slug = pageSlug;
        let counter = 1;

        while (
          await this.prisma.dynamicPage.findUnique({
            where: { slug },
          })
        ) {
          slug = `${pageSlug}-${counter++}`;
        }
      }

      // 3. Update page
      const updatedPage = await this.prisma.dynamicPage.update({
        where: { id },
        data: {
          title: payload.title ?? existingPage.title,
          slug,
          description: payload.description ?? existingPage.description,
          isActive: payload.isActive ?? existingPage.isActive,
        },
      });
      let up: any
      if (existingPage.isActive === true) {
        up = await this.prisma.menu.updateMany({
          where: {
            menu_item_id: id
          },
          data: {
            status: "INACTIVE"
          }
        })
      } else if (existingPage.isActive === false) {
        up = await this.prisma.menu.updateMany({
          where: {
            menu_item_id: id
          },
          data: {
            status: "ACTIVE"
          }
        })
      }
      console.log("up", up);
      console.log("id", id);



      // ----------- META DATA HANDLING -----------
      if (updatedPage) {
        let isPageAvailable = await this.prisma.metaData.findFirst({
          where: {
            table_id: updatedPage?.id,
            table_name: 'page',
            key: '_page_meta'
          }
        });
        let metaDetails = {
          meta_title: payload?.meta_title,
          meta_description: payload?.meta_description,
          meta_keyword: payload?.meta_keyword,
          other_meta: payload.other_meta
        }
        if (isPageAvailable) {
          await this.prisma.metaData.update({
            where: {
              id: isPageAvailable?.id
            },
            data: {
              table_id: updatedPage.id,
              table_name: "page",
              key: "_page_meta",
              value: JSON.stringify(metaDetails)
            }
          });
        } else {
          await createMetaData(
            updatedPage.id,
            "page",
            "_page_meta",
            JSON.stringify(metaDetails)
          )
        }
      }

      return {
        message: 'Dynamic page updated successfully',
        data: updatedPage,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update dynamic page');
    }
  }

  async removeDynamicPage(id: bigint) {
    try {
      const dynamicPage = await this.prisma.dynamicPage.delete({ where: { id } });
      await this.prisma.menu.deleteMany({
        where: {
          menu_item_id: id
        }
      })
      return dynamicPage;
    } catch (error) {
      throw new BadRequestException(error.message || "Failed to remove dynamic page");
    }
  };

}
