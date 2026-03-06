import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptData } from '@/common/helper/common.helper';
import { R2Service } from '@/common/helper/r2.helper';

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
  ) { }

  create(createAgentDto: CommonDto) {
    return 'This action adds a new agent';
  }

  async findAllSales(agent_id: bigint, getSalesDto: CommonDto) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException('Agent organization not found');
      }
      const payload = decryptData(getSalesDto.data);
      const page = Number(payload.page) || 1;
      const limit = Number(payload.limit) || 10;
      const search = payload.search?.trim();
      const status = payload.status?.trim();

      const skip = (page - 1) * limit;
      const where: any = {
        agent_id,
        org_id: org.id
      };

      if (search) {
        where.OR = [
          {}
        ];
      }
      if (status) {
        where.agentKYC = {
          status: status,
        };
      }
      const agentSales = await this.prisma.agentSale.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: "desc"
        },
        select: {
          id: true,
          organization: {
            select: {
              id: true,
              name: true,
              contact_email: true,
              contact_phone: true,
            }
          },
          productEntity: {
            select: {
              id: true,
              name: true,
              slug: true,
              desc: true,
            }
          },
          sale_date: true,
          status: true,
          created_at: true
        }
      })

      if (!agentSales) {
        throw new NotFoundException('No sale found');
      }
      return agentSales;
    } catch (error) {
      throw error;
    }
  }

  // async findOneSale(agent_id: bigint, sale_id: bigint) {
  //   try {
  //     const org = await this.prisma.organization.findUnique({
  //       where: { created_by: agent_id },
  //       select: { id: true },
  //     });

  //     if (!org?.id) {
  //       throw new BadRequestException("Agent organization not found");
  //     }

  //     const sale = await this.prisma.agentSale.findFirst({
  //       where: {
  //         id: sale_id,
  //         org_id: org.id,
  //       },
  //       include: {
  //         productEntity: {
  //           include: {
  //             products: true,
  //           },
  //         },
  //         customer: {
  //           include: {
  //             country: true,
  //             statusHistories: true,
  //           },
  //         },
  //         fixedDeposit: true,
  //         insurance: true,
  //         mutualFund: true,
  //         realEstate: true,
  //       },
  //     });

  //     if (!sale) {
  //       throw new BadRequestException("Sale not found");
  //     }

  //     const [
  //       imageUrl,
  //       panImageUrl,
  //       aadharFrontUrl,
  //       aadharBackUrl,
  //     ] = await Promise.all([
  //       sale.customer.image
  //         ? R2Service.getSignedUrl(sale.customer.image)
  //         : null,
  //       sale.customer.panImage
  //         ? R2Service.getSignedUrl(sale.customer.panImage)
  //         : null,
  //       sale.customer.aadharFront
  //         ? R2Service.getSignedUrl(sale.customer.aadharFront)
  //         : null,
  //       sale.customer.aadharBack
  //         ? R2Service.getSignedUrl(sale.customer.aadharBack)
  //         : null,
  //     ]);

  //     const customer = {
  //       ...sale.customer,
  //       image: imageUrl,
  //       panImage: panImageUrl,
  //       aadharFront: aadharFrontUrl,
  //       aadharBack: aadharBackUrl,
  //     };

  //     const productSlug = sale.productEntity.products.slug;

  //     let productData: any = null;
  //     let productKey: string;

  //     switch (productSlug) {
  //       case "fixed-deposit":
  //         productKey = "fixedDeposit";
  //         productData = sale.fixedDeposit;
  //         break;

  //       case "insurance":
  //         productKey = "insurance";
  //         productData = sale.insurance;
  //         break;

  //       case "mutual-funds":
  //         productKey = "mutualFund";
  //         productData = sale.mutualFund;
  //         break;

  //       case "real-estate":
  //         productKey = "realEstate";
  //         productData = sale.realEstate;
  //         break;

  //       default:
  //         throw new BadRequestException("Unsupported product type");
  //     }

  //     if (productData?.documents?.length) {
  //       productData = {
  //         ...productData,
  //         documents: await this.resolveDocuments(productData.documents),
  //       };
  //     }

  //     const saleResponse = {
  //       id: sale.id,
  //       status: sale.status,
  //       sale_date: sale.sale_date,
  //       customer: { ...customer },
  //       product: {
  //         id: sale.productEntity.products.id,
  //         name: sale.productEntity.products.name,
  //         slug: sale.productEntity.products.slug,
  //         entity: {
  //           id: sale.productEntity.id,
  //           name: sale.productEntity.name,
  //           slug: sale.productEntity.slug,
  //         },
  //       },
  //       [productKey]: productData,
  //     };

  //     return saleResponse;
  //   } catch (error) {
  //     throw error;
  //   }
  // }


  async findOneSale(agent_id: bigint, sale_id: bigint) {
    try {
      /* -----------------------------
       * 1️⃣ ORG VALIDATION
       * ----------------------------- */
      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      /* -----------------------------
       * 2️⃣ SALE FETCH
       * ----------------------------- */
      const sale = await this.prisma.agentSale.findFirst({
        where: {
          id: sale_id,
          org_id: org.id,
        },
        include: {
          productEntity: {
            include: {
              products: true,
            },
          },
          customer: {
            include: {
              country: true,
              statusHistories: true,
            },
          },
          fixedDeposit: true,
          insurance: true,
          mutualFund: true,
          realEstate: true,
          loan: true,
        },
      });

      if (!sale) {
        throw new BadRequestException("Sale not found");
      }

      /* -----------------------------
       * 3️⃣ CUSTOMER IMAGE SIGNED URLS
       * ----------------------------- */
      const [
        imageUrl,
        panImageUrl,
        aadharFrontUrl,
        aadharBackUrl,
      ] = await Promise.all([
        sale.customer.image
          ? R2Service.getSignedUrl(sale.customer.image)
          : null,
        sale.customer.panImage
          ? R2Service.getSignedUrl(sale.customer.panImage)
          : null,
        sale.customer.aadharFront
          ? R2Service.getSignedUrl(sale.customer.aadharFront)
          : null,
        sale.customer.aadharBack
          ? R2Service.getSignedUrl(sale.customer.aadharBack)
          : null,
      ]);

      const customer = {
        ...sale.customer,
        image: imageUrl,
        panImage: panImageUrl,
        aadharFront: aadharFrontUrl,
        aadharBack: aadharBackUrl,
      };

      /* -----------------------------
       * 4️⃣ PRODUCT RESOLUTION
       * ----------------------------- */
      const productSlug = sale.productEntity.products.slug;

      let productData: any = null;
      let productKey: string;

      switch (productSlug) {
        case "fixed-deposit":
          productKey = "fixedDeposit";
          productData = sale.fixedDeposit;
          break;

        case "insurance":
          productKey = "insurance";
          productData = sale.insurance;
          break;

        case "mutual-funds":
          productKey = "mutualFund";
          productData = sale.mutualFund;
          break;

        case "real-estate":
          productKey = "realEstate";
          productData = sale.realEstate;
          break;

        case "loans":
          productKey = "loan";
          productData = sale.loan;
          break;

        default:
          throw new BadRequestException("Unsupported product type");
      }

      /* -----------------------------
       * 5️⃣ FETCH DOCUMENTS FROM NEW TABLE
       * ----------------------------- */
      const documents = await this.prisma.saleDocument.findMany({
        where: {
          sale_id: sale.id,
          deleted_at: null,
        },
        select: {
          id: true,
          file_path: true,
          file_name: true,
          mime_type: true,
          uploaded_at: true,
        },
        orderBy: { uploaded_at: "desc" },
      });

      const resolvedDocuments = await Promise.all(
        documents.map(async (doc) => ({
          id: doc.id.toString(),
          file_name: doc.file_name,
          mime_type: doc.mime_type,
          uploaded_at: doc.uploaded_at,
          url: await R2Service.getSignedUrl(doc.file_path),
        }))
      );

      /* -----------------------------
       * 6️⃣ ATTACH DOCUMENTS (STRUCTURE UNCHANGED)
       * ----------------------------- */
      if (productData) {
        productData = {
          ...productData,
          documents: resolvedDocuments,
        };
      }

      /* -----------------------------
       * 7️⃣ FINAL RESPONSE
       * ----------------------------- */
      return {
        id: sale.id,
        status: sale.status,
        sale_date: sale.sale_date,
        customer: { ...customer },
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
        [productKey]: productData,
      };
    } catch (error) {
      throw error;
    }
  }

  private async resolveDocuments(documents?: string[]) {
    if (!documents || !documents.length) return [];
    return Promise.all(documents.map((key) => R2Service.getSignedUrl(key)));
  }

  update(id: number, updateAgentDto: CommonDto) {
    return `This action updates a #${id} agent`;
  }

  remove(id: number) {
    return `This action removes a #${id} agent`;
  }
}
