import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { buildUserRootFolder, createNotification, decryptData } from '@/common/helper/common.helper';
import { PrismaService } from '@/prisma/prisma.service';
import { isValidImageBuffer } from '@/common/config/multer.config';
import { extname, basename } from 'path';
import { R2Service } from '@/common/helper/r2.helper';
import { CustomerStatus } from '@generated/prisma';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async sanitizeFileName(filename: string) {
    const name = basename(filename, extname(filename))
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .toLowerCase();

    return `${name}${extname(filename).toLowerCase()}`;
  }

  async create(agent_id: bigint, file: any, createCustomerDto: CommonDto) {
    try {
      const payload = decryptData(createCustomerDto.data);
      const {
        firstName,
        lastName,
        email,
        phone,
        aadhaarNumber,
        panNumber,
        address,
        status
      } = payload;

      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: {
          id: true,
          createdByUser: {
            select: {
              agentKYC: {
                select: {
                  base_img_path: true,
                }
              }
            }
          }
        },
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      let existingCustomer = await this.prisma.customer.findFirst({
        where: {
          org_id: org?.id,
          email,
          pan_number: panNumber,
          aadhaar_number: aadhaarNumber
        },
      });

      if (existingCustomer) {
        throw new BadRequestException("Customer already exists");
      }

      let imageKey: string | null = null;
      const baseimgkey = org?.createdByUser?.agentKYC?.base_img_path || "";

      if (file?.buffer) {
        const isValid = await isValidImageBuffer(file.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid image file');
        }
        const rootFolder = buildUserRootFolder(
          `${firstName}_${lastName}`,
          panNumber,
          undefined,
          baseimgkey,
          true,
        );
        const sanitizedFileName = await this.sanitizeFileName(file.originalname);
        imageKey = `${rootFolder}/${sanitizedFileName}`;
        await R2Service.upload(file.buffer, imageKey, file.mimetype);
      }

      const customer = await this.prisma.customer.create({
        data: {
          org_id: org?.id,
          created_by: agent_id,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          aadhaar_number: aadhaarNumber,
          pan_number: panNumber,
          address,
          image: imageKey,
          status
        },
      });

      return customer;
    } catch (error) {
      throw error;
    }
  }

  async updateCustomer(
    agent_id: bigint,
    customer_id: bigint,
    file: any,
    createCustomerDto: CommonDto,
  ) {
    try {
      const payload = decryptData(createCustomerDto.data);
      const {
        firstName,
        lastName,
        email,
        phone,
        aadhaarNumber,
        panNumber,
        address,
        remove,
        status: newStatus,
        reason,
      } = payload;

      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException('Agent organization not found');
      }

      const customer = await this.prisma.customer.findFirst({
        where: { id: customer_id, org_id: org.id },
      });

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }
      const oldStatus = customer.status;

      let imageKey: string | null = customer.image;
      if (remove === true && customer.image) {
        await R2Service.remove(customer.image);
        imageKey = null;
      }

      if (file?.buffer) {
        const isValid = await isValidImageBuffer(file.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid image file');
        }

        if (customer.image) {
          await R2Service.remove(customer.image);
        }

        imageKey = `customers/${customer_id}/${file.originalname}`;
        await R2Service.upload(file.buffer, imageKey, file.mimetype);
      }

      const updatedCustomer = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.customer.update({
          where: { id: customer_id },
          data: {
            first_name: firstName ?? customer.first_name,
            last_name: lastName ?? customer.last_name,
            email,
            phone,
            aadhaar_number: aadhaarNumber,
            pan_number: panNumber,
            address,
            image: imageKey,
            status: newStatus ?? customer.status,
          },
        });

        if (newStatus && newStatus !== oldStatus) {
          await tx.customerStatusHistory.create({
            data: {
              customer_id,
              old_status: oldStatus,
              new_status: newStatus,
              changed_by: agent_id,
              reason,
            },
          });

          await createNotification(
            agent_id,
            'CUSTOMER_STATUS',
            'Customer status updated',
            `Status changed from ${oldStatus} → ${newStatus}`,
            {
              customer_id,
              old_status: oldStatus,
              new_status: newStatus,
              action: 'status_update',
            },
          );
        }

        return updated;
      });

      return updatedCustomer;
    } catch (error) {
      throw error;
    }
  }


  async updateCustomerStatus(
    agent_id: bigint,
    customer_id: bigint,
    newStatus: CustomerStatus,
    reason?: string
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customer_id },
      select: { status: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.status === newStatus) {
      return { message: 'Status unchanged' };
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update customer
      await tx.customer.update({
        where: { id: customer_id },
        data: { status: newStatus },
      });

      // 2. Insert history
      await tx.customerStatusHistory.create({
        data: {
          customer_id,
          old_status: customer.status,
          new_status: newStatus,
          changed_by: agent_id,
          reason,
        },
      });

      await createNotification(
        agent_id,
        'CUSTOMER_STATUS',
        'Customer status updated',
        `Status changed from ${customer.status} → ${newStatus}`,
        {
          customer_id,
          old_status: customer.status,
          new_status: newStatus,
          action: 'update',
        }
      );
    });

    return true;
  }


  async sellProduct(
    agent_id: bigint,
    customer_id: bigint,
    sellProductDto: CommonDto
  ) {
    try {
      const payload = decryptData(sellProductDto.data);
      const {
        product_entity_id,
        product_data,
      } = payload;


      if (!product_entity_id) {
        throw new BadRequestException("Product entity Id is required");
      }

      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: {
          id: true,
        },
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      const customer = await this.prisma.customer.findFirst({
        where: {
          id: customer_id,
          org_id: org?.id,
        },
      });

      if (!customer) {
        throw new BadRequestException("Customer not found");
      }

      const productEntity = await this.prisma.productEntity.findUnique({
        where: { id: product_entity_id },
        include: {
          products: {
            select: {
              id: true,
              slug: true,
              status: true,
            },
          },
        },
      });

      if (!productEntity || productEntity.products.status !== "ACTIVE") {
        throw new BadRequestException("Invalid or inactive product");
      }
      const productSlug = productEntity.products.slug;

      return await this.prisma.$transaction(async (tx) => {
        const sale = await tx.agentSale.create({
          data: {
            org_id: org?.id,
            agent_id,
            customer_id,
            product_entity_id,
          },
        });

        switch (productSlug) {
          case "life-insurance":
            await tx.productLifeInsurance.create({
              data: {
                sale_id: sale.id,
                ...product_data,
              },
            });
            break;

          case "medical-insurance":
            await tx.productMedicalInsurance.create({
              data: {
                sale_id: sale.id,
                ...product_data,
              },
            });
            break;

          case "real-estate":
            await tx.productRealEstate.create({
              data: {
                sale_id: sale.id,
                ...product_data,
              },
            });
            break;

          case "mutual-fund":
            await tx.productMutualFund.create({
              data: {
                sale_id: sale.id,
                ...product_data,
              },
            });
            break;

          default:
            throw new BadRequestException("Invalid product type");
        }
        return sale;
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(agent_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);

      const page = payload?.page ? Number(payload.page) : null;
      const limit = payload?.limit ? Number(payload.limit) : null;

      const isPaginated = page && limit;
      const skip = isPaginated ? (page - 1) * limit : undefined;
      const take = isPaginated ? limit : undefined;

      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: {
          id: true,
        },
      });

      if (!org?.id) {
        throw new BadRequestException('Agent organization not found');
      }

      const where: any = {
        org_id: org.id,
        created_by: agent_id,
        ...(payload.status && { status: payload.status }),
        ...(payload.search && {
          OR: [
            { first_name: { contains: payload.search, mode: 'insensitive' } },
            { last_name: { contains: payload.search, mode: 'insensitive' } },
            { email: { contains: payload.search, mode: 'insensitive' } },
            { phone: { contains: payload.search, mode: 'insensitive' } },
            { aadhaar_number: { contains: payload.search, mode: 'insensitive' } },
            { pan_number: { contains: payload.search, mode: 'insensitive' } },
          ],
        }),
      };

      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          ...(isPaginated && { skip, take }),
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            aadhaar_number: true,
            pan_number: true,
            address: true,
            image: true,
            status: true,
            created_at: true,
          },
        }),
        this.prisma.customer.count({ where }),
      ]);

      const customersWithImageUrl = await Promise.all(
        customers.map(async (customer) => ({
          ...customer,
          image: customer.image
            ? await R2Service.getSignedUrl(customer.image)
            : null,
        })),
      );

      return {
        Customers: customersWithImageUrl,
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }


  async findOne(agent_id: bigint, customer_id: bigint) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException('Agent organization not found');
      }

      const customer = await this.prisma.customer.findFirst({
        where: {
          id: customer_id,
          created_by: agent_id,
          org_id: org.id,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          aadhaar_number: true,
          pan_number: true,
          address: true,
          image: true,
          status: true,
          statusHistories: {
            select: {
              id: true,
              old_status: true,
              new_status: true,
              reason: true,
              created_at: true,
            }
          },
          created_at: true,
          agentSales: {
            select: {
              id: true,
              status: true,
              sale_date: true,
              productEntity: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  products: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
              lifeInsurance: true,
              medicalInsurance: true,
              mutualFund: true,
              realEstate: true,
            },
          },
          meetings: {
            select: {
              id: true,
              title: true,
              description: true,
              is_completed: true,
              start_time: true,
              end_time: true,
              meeting_type: true,
              completed_at: true,
              mom: true,
              status: true,
            },
          },
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found.');
      }

      const imageUrl = customer.image
        ? await R2Service.getSignedUrl(customer.image)
        : null;

      const formatCustomerResponse = (customer: any) => {
        return {
          ...customer,
          image: imageUrl,
          agentSales: customer.agentSales.map((sale: any) => {
            const formattedSale: any = {
              id: sale.id,
              status: sale.status,
              sale_date: sale.sale_date,
              product: {
                id: sale.productEntity.products.id,
                name: sale.productEntity.products.name,
                slug: sale.productEntity.products.slug,
                entity: {
                  id: sale.productEntity.id,
                  name: sale.productEntity.name,
                  slug: sale.productEntity.slug,
                },
              },
            };
            if (sale.lifeInsurance) {
              formattedSale.lifeInsurance = sale.lifeInsurance;
            } else if (sale.medicalInsurance) {
              formattedSale.medicalInsurance = sale.medicalInsurance;
            } else if (sale.mutualFund) {
              formattedSale.mutualFund = sale.mutualFund;
            } else if (sale.realEstate) {
              formattedSale.realEstate = sale.realEstate;
            }

            return formattedSale;
          }),
        };
      };

      return formatCustomerResponse(customer);
    } catch (error) {
      throw error;
    }
  }


  async updateSale(
    agent_id: bigint,
    sale_id: bigint,
    updateSaleDto: CommonDto
  ) {
    try {
      const payload = decryptData(updateSaleDto.data);
      const { sale_data, product_data } = payload;

      /* ------------------------------------
         1️⃣ Fetch agent organization
      -------------------------------------*/
      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      /* ------------------------------------
         2️⃣ Fetch sale with product relations
      -------------------------------------*/
      const sale = await this.prisma.agentSale.findFirst({
        where: {
          id: sale_id,
          agent_id,
          org_id: org.id,
        },
        include: {
          lifeInsurance: true,
          medicalInsurance: true,
          mutualFund: true,
          realEstate: true,
        },
      });

      if (!sale) {
        throw new BadRequestException("Sale not found");
      }

      /* ------------------------------------
         3️⃣ Detect which product table exists
      -------------------------------------*/
      let productKey:
        | "lifeInsurance"
        | "medicalInsurance"
        | "mutualFund"
        | "realEstate"
        | null = null;

      let productId: bigint | null = null;

      if (sale.lifeInsurance) {
        productKey = "lifeInsurance";
        productId = sale.lifeInsurance.id;
      } else if (sale.medicalInsurance) {
        productKey = "medicalInsurance";
        productId = sale.medicalInsurance.id;
      } else if (sale.mutualFund) {
        productKey = "mutualFund";
        productId = sale.mutualFund.id;
      } else if (sale.realEstate) {
        productKey = "realEstate";
        productId = sale.realEstate.id;
      }

      if (!productKey || !productId) {
        throw new BadRequestException("No product data found for this sale");
      }

      /* ------------------------------------
         4️⃣ Product update dispatcher (TS-safe)
      -------------------------------------*/
      const productUpdateMap = {
        lifeInsurance: (tx: any) =>
          tx.productLifeInsurance.update({
            where: { id: productId! },
            data: product_data,
          }),

        medicalInsurance: (tx: any) =>
          tx.productMedicalInsurance.update({
            where: { id: productId! },
            data: product_data,
          }),

        mutualFund: (tx: any) =>
          tx.productMutualFund.update({
            where: { id: productId! },
            data: product_data,
          }),

        realEstate: (tx: any) =>
          tx.productRealEstate.update({
            where: { id: productId! },
            data: product_data,
          }),
      };

      return await this.prisma.$transaction(async (tx) => {
        if (sale_data && Object.keys(sale_data).length > 0) {
          await tx.agentSale.update({
            where: { id: sale_id },
            data: sale_data,
          });
        }

        if (product_data && Object.keys(product_data).length > 0) {
          await productUpdateMap[productKey!](tx);
        }

        return true;
      });
    } catch (error) {
      throw error;
    }
  }


  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}
