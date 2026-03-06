import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { createNotification, decryptData } from '@/common/helper/common.helper';
import { PrismaService } from '@/prisma/prisma.service';
import { isValidImageBuffer, validateSafePdf } from '@/common/config/multer.config';
import { extname, basename } from 'path';
import { R2Service } from '@/common/helper/r2.helper';
import { CustomerStatus, Prisma, SaleProductType } from '@generated/prisma';
import slugify from 'slugify';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { FormSuggestionService } from '@/agent-form-suggestion/suggestion.service';

type CustomerSupportingDocumentUpload = {
  file_path: string;
  file_name?: string | null;
  mime_type?: string | null;
};

@Injectable()
export class CustomerService {
  private readonly supportingDocumentMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ]);

  constructor(
    private prisma: PrismaService,
    private formSuggestionService: FormSuggestionService,
  ) { }

  async sanitizeFileName(filename: string) {
    const name = basename(filename, extname(filename))
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .toLowerCase();

    return `${name}${extname(filename).toLowerCase()}`;
  }

  private extractBankDetails(payload: any) {
    const bankDetails = payload?.bankDetails ?? payload?.bank_details ?? {};

    return {
      bankAccountNumber:
        payload?.bankAccountNumber ??
        payload?.bank_account_number ??
        bankDetails?.accountNumber ??
        bankDetails?.account_number,
      ifscCode:
        payload?.ifscCode ??
        payload?.ifsc_code ??
        bankDetails?.ifscCode ??
        bankDetails?.ifsc_code,
      bankName:
        payload?.bankName ??
        payload?.bank_name ??
        bankDetails?.bankName ??
        bankDetails?.bank_name,
      branchName:
        payload?.branchName ??
        payload?.branch_name ??
        bankDetails?.branchName ??
        bankDetails?.branch_name,
    };
  }

  private parseBigIntIds(value: unknown): bigint[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const ids: bigint[] = [];
    for (const item of value) {
      try {
        if (item !== null && item !== undefined && item !== '') {
          ids.push(BigInt(item));
        }
      } catch {
        continue;
      }
    }

    return ids;
  }

  private parseStringList(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private async uploadSupportingDocuments(
    supportingDocumentFiles: any[],
    rootFolder: string,
  ): Promise<CustomerSupportingDocumentUpload[]> {
    const uploadedDocuments: CustomerSupportingDocumentUpload[] = [];

    for (let index = 0; index < supportingDocumentFiles.length; index++) {
      const file = supportingDocumentFiles[index];
      const mimeType = (file?.mimetype || '').toLowerCase();

      if (!this.supportingDocumentMimeTypes.has(mimeType)) {
        throw new BadRequestException(
          `Invalid supporting document: ${file?.originalname || `file-${index + 1}`}`,
        );
      }

      if (mimeType.startsWith('image/')) {
        const isValid = await isValidImageBuffer(file.buffer);
        if (!isValid) {
          throw new BadRequestException(
            `Invalid supporting document image: ${file.originalname}`,
          );
        }
      }

      const sanitizedFileName = await this.sanitizeFileName(
        file.originalname || `supporting-document-${index + 1}`,
      );

      const documentKey =
        `${rootFolder}/supporting_documents/` +
        `${Date.now()}_${index}_${sanitizedFileName}`;

      await R2Service.upload(file.buffer, documentKey, file.mimetype);

      uploadedDocuments.push({
        file_path: documentKey,
        file_name: sanitizedFileName,
        mime_type: file.mimetype,
      });
    }

    return uploadedDocuments;
  }

  async create(agent_id: bigint, files: any, createCustomerDto: CommonDto) {
    try {
      const payload = decryptData(createCustomerDto.data);
      const {
        firstName,
        lastName,
        email,
        phone,
        date_of_birth,
        aadhaarNumber,
        panNumber,
        address,
        status,
        country_id,
        notes,
        income,
      } = payload;
      const { bankAccountNumber, ifscCode, bankName, branchName } =
        this.extractBankDetails(payload);

      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: {
          id: true,
          createdByUser: {
            select: {
              agentKYC: {
                select: { base_img_path: true }
              }
            }
          }
        }
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      const now = new Date();

      const subscription =
        await this.prisma.organizationSubscription.findFirst({
          where: {
            org_id: org.id,
            status: {
              in: ["ACTIVE", "TRIAL", "PAUSED", "CANCELLED", "UPGRADED"],
            },
            OR: [
              { end_at: null },
              { end_at: { gt: now } },
            ],
          },
          orderBy: [
            { start_at: "desc" },
            { created_at: "desc" },
          ],
          include: {
            plan: {
              select: {
                max_customers: true,
              },
            },
          },
        });

      let isSubscribed = false;

      if (!subscription) {
        isSubscribed = false;
      } else {
        switch (subscription.status) {
          case "ACTIVE":
          case "TRIAL":
          case "PAUSED":
          case "UPGRADED":
            isSubscribed = true;
            break;

          case "CANCELLED":
            isSubscribed = false;
            break;
          default:
            isSubscribed = false;
        }
      }

      if (!isSubscribed) {
        throw new BadRequestException(
          "Active subscription required to create customers"
        );
      }

      const maxCustomers = subscription?.plan.max_customers;

      const currentCustomerCount = await this.prisma.customer.count({
        where: { org_id: org.id },
      });

      if (
        typeof maxCustomers === "number" &&
        currentCustomerCount >= maxCustomers
      ) {
        throw new BadRequestException(
          "Maximum customer limit reached for your current plan"
        );
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

      // let imageKey: string | null = null;
      // const baseimgkey = org?.createdByUser?.agentKYC?.base_img_path || "";

      // if (file?.buffer) {
      //   const isValid = await isValidImageBuffer(file.buffer);
      //   if (!isValid) {
      //     throw new BadRequestException('Invalid image file');
      //   }
      //   const rootFolder = buildUserRootFolder(
      //     `${firstName}_${lastName}`,
      //     panNumber,
      //     undefined,
      //     baseimgkey,
      //     true,
      //   );
      //   const sanitizedFileName = await this.sanitizeFileName(file.originalname);
      //   imageKey = `${rootFolder}/${sanitizedFileName}`;
      //   await R2Service.upload(file.buffer, imageKey, file.mimetype);
      // }

      let image_key: string | null = null;
      let pan_image_key: string | null = null;
      let aadhar_front_key: string | null = null;
      let aadhar_back_key: string | null = null;
      let cancelled_cheque_photo_key: string | null = null;

      const safeName = slugify(`${firstName}_${lastName}`, { lower: true });

      const baseimgkey = org?.createdByUser?.agentKYC?.base_img_path || "";
      const rootFolder =
        `${process.env.ROOT_FOLDER}
      /${process.env.IMAGE_PATH}/
      ${process.env.USER_IMAGE_PATH}/
      ${baseimgkey}/${process.env.CUSTOMER_IMAGE_PATH}/
      ${safeName}_${phone}/${process.env.KYC_IMAGE_PATH}`;

      const baseFolderPath = `${baseimgkey}/${process.env.CUSTOMER_IMAGE_PATH}/${safeName}_${phone}`

      // const rootFolder = buildUserRootFolder(
      //   `${firstName}_${lastName}`,
      //   panNumber,
      //   undefined,
      //   baseimgkey,
      //   true,
      // );

      const imageFile = files.image?.[0]
      const panImageFile = files.pan_image?.[0]
      const aadharFrontImageFile = files.aadhar_front?.[0]
      const aadharBackImageFile = files.aadhar_back?.[0]
      const cancelledChequeFile = files.cancelled_cheque_photo?.[0];
      const supportingDocumentFiles = files.supporting_documents || [];

      if (imageFile) {
        const isValid = await isValidImageBuffer(imageFile.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid image file');
        }
        const ext = imageFile.mimetype.split("/")[1];
        image_key = `${rootFolder}/image.${ext}`;

        await R2Service.upload(
          imageFile.buffer,
          image_key,
          imageFile.mimetype
        );
      }

      if (panImageFile) {
        const isValid = await isValidImageBuffer(panImageFile.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid pan image file');
        }
        const ext = panImageFile.mimetype.split("/")[1];
        pan_image_key = `${rootFolder}/pan.${ext}`;

        await R2Service.upload(
          panImageFile.buffer,
          pan_image_key,
          panImageFile.mimetype
        );
      }

      if (aadharFrontImageFile) {
        const isValid = await isValidImageBuffer(aadharFrontImageFile.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid aadhaar front image file');
        }
        const ext = aadharFrontImageFile.mimetype.split("/")[1];
        aadhar_front_key = `${rootFolder}/aadhaar_front.${ext}`;

        await R2Service.upload(
          aadharFrontImageFile.buffer,
          aadhar_front_key,
          aadharFrontImageFile.mimetype
        );
      }

      if (aadharBackImageFile) {
        const isValid = await isValidImageBuffer(aadharBackImageFile.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid aadhaar back image file');
        }
        const ext = aadharBackImageFile.mimetype.split("/")[1];
        aadhar_back_key = `${rootFolder}/aadhaar_back.${ext}`;

        await R2Service.upload(
          aadharBackImageFile.buffer,
          aadhar_back_key,
          aadharBackImageFile.mimetype
        );
      }

      if (cancelledChequeFile) {
        const isValid = await isValidImageBuffer(cancelledChequeFile.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid cancelled cheque image file');
        }
        const ext = cancelledChequeFile.mimetype.split("/")[1];
        cancelled_cheque_photo_key = `${rootFolder}/cancelled_cheque.${ext}`;

        await R2Service.upload(
          cancelledChequeFile.buffer,
          cancelled_cheque_photo_key,
          cancelledChequeFile.mimetype
        );
      }

      const supportingDocuments = await this.uploadSupportingDocuments(
        supportingDocumentFiles,
        rootFolder,
      );

      const customer = await this.prisma.customer.create({
        data: {
          org_id: org?.id,
          created_by: agent_id,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          date_of_birth,
          country_id,
          aadhaar_number: aadhaarNumber,
          pan_number: panNumber,
          address,
          image: image_key,
          panImage: pan_image_key,
          aadharFront: aadhar_front_key,
          aadharBack: aadhar_back_key,
          bank_account_number: bankAccountNumber,
          bank_ifsc_code: ifscCode,
          bank_name: bankName,
          bank_branch_name: branchName,
          cancelled_cheque_photo: cancelled_cheque_photo_key,
          notes,
          income,
          base_folder_path: baseFolderPath,
          status,
          ...(supportingDocuments.length
            ? {
              supportingDocuments: {
                create: supportingDocuments,
              },
            }
            : {}),
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
    files: any,
    createCustomerDto: CommonDto,
  ) {
    try {
      const payload = decryptData(createCustomerDto.data);
      const {
        firstName,
        lastName,
        email,
        phone,
        date_of_birth,
        aadhaarNumber,
        panNumber,
        address,
        country_id,
        status: newStatus,
        reason,
        notes,
        income,
        removeImage,
        removePanImage,
        removeAadharFront,
        removeAadharBack,
        removeCancelledChequePhoto,
        removeSupportingDocumentIds,
        removeSupportingDocumentPaths,
        removeAllSupportingDocuments,
      } = payload;
      const { bankAccountNumber, ifscCode, bankName, branchName } =
        this.extractBankDetails(payload);

      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: {
          id: true,
          createdByUser: {
            select: {
              agentKYC: {
                select: { base_img_path: true },
              },
            },
          },
        },
      });

      if (!org?.id) {
        throw new BadRequestException('Agent organization not found');
      }

      const customer = await this.prisma.customer.findFirst({
        where: {
          id: customer_id,
          org_id: org.id,
        },
        include: {
          supportingDocuments: {
            select: {
              id: true,
              file_path: true,
            },
          },
        },
      });

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }
      const oldStatus = customer.status;

      let image_key: string | null = customer.image;
      let pan_image_key: string | null = customer.panImage;
      let aadhar_front_key: string | null = customer.aadharFront;
      let aadhar_back_key: string | null = customer.aadharBack;
      let cancelled_cheque_photo_key: string | null =
        customer.cancelled_cheque_photo;

      const baseimgkey = customer?.base_folder_path || "";
      const rootFolder =
        `${process.env.ROOT_FOLDER}
      /${process.env.IMAGE_PATH}/
      ${process.env.USER_IMAGE_PATH}/
      ${baseimgkey}/${process.env.KYC_IMAGE_PATH}`;

      const imageFile = files?.image?.[0];
      const panImageFile = files?.pan_image?.[0];
      const aadharFrontFile = files?.aadhar_front?.[0];
      const aadharBackFile = files?.aadhar_back?.[0];
      const cancelledChequeFile = files?.cancelled_cheque_photo?.[0];
      const supportingDocumentFiles = files?.supporting_documents || [];

      const supportingDocumentIdsToRemove = this.parseBigIntIds(
        removeSupportingDocumentIds,
      );
      const supportingDocumentPathsToRemove = new Set(
        this.parseStringList(removeSupportingDocumentPaths),
      );
      const shouldRemoveAllSupportingDocuments =
        removeAllSupportingDocuments === true ||
        removeAllSupportingDocuments === 'true';

      const removableSupportingDocuments = customer.supportingDocuments.filter(
        (doc) => {
          if (shouldRemoveAllSupportingDocuments) {
            return true;
          }

          const matchesId = supportingDocumentIdsToRemove.some(
            (id) => id === doc.id,
          );
          const matchesPath = supportingDocumentPathsToRemove.has(doc.file_path);

          return matchesId || matchesPath;
        },
      );

      if (removeImage && customer.image) {
        await R2Service.remove(customer.image);
        image_key = null;
      }

      if (removePanImage && customer.panImage) {
        await R2Service.remove(customer.panImage);
        pan_image_key = null;
      }

      if (removeAadharFront && customer.aadharFront) {
        await R2Service.remove(customer.aadharFront);
        aadhar_front_key = null;
      }

      if (removeAadharBack && customer.aadharBack) {
        await R2Service.remove(customer.aadharBack);
        aadhar_back_key = null;
      }

      if (removeCancelledChequePhoto && customer.cancelled_cheque_photo) {
        await R2Service.remove(customer.cancelled_cheque_photo);
        cancelled_cheque_photo_key = null;
      }

      if (imageFile) {
        const isValid = await isValidImageBuffer(imageFile.buffer);
        if (!isValid) throw new BadRequestException('Invalid image file');

        if (customer.image) await R2Service.remove(customer.image);

        const ext = imageFile.mimetype.split('/')[1];
        image_key = `${rootFolder}/image.${ext}`;

        await R2Service.upload(imageFile.buffer, image_key, imageFile.mimetype);
      }

      if (panImageFile) {
        const isValid = await isValidImageBuffer(panImageFile.buffer);
        if (!isValid) throw new BadRequestException('Invalid pan image file');

        if (customer.panImage) await R2Service.remove(customer.panImage);

        const ext = panImageFile.mimetype.split('/')[1];
        pan_image_key = `${rootFolder}/pan.${ext}`;

        await R2Service.upload(
          panImageFile.buffer,
          pan_image_key,
          panImageFile.mimetype,
        );
      }

      if (aadharFrontFile) {
        const isValid = await isValidImageBuffer(aadharFrontFile.buffer);
        if (!isValid)
          throw new BadRequestException('Invalid aadhaar front image');

        if (customer.aadharFront) await R2Service.remove(customer.aadharFront);

        const ext = aadharFrontFile.mimetype.split('/')[1];
        aadhar_front_key = `${rootFolder}/aadhaar_front.${ext}`;

        await R2Service.upload(
          aadharFrontFile.buffer,
          aadhar_front_key,
          aadharFrontFile.mimetype,
        );
      }

      if (aadharBackFile) {
        const isValid = await isValidImageBuffer(aadharBackFile.buffer);
        if (!isValid)
          throw new BadRequestException('Invalid aadhaar back image');

        if (customer.aadharBack) await R2Service.remove(customer.aadharBack);

        const ext = aadharBackFile.mimetype.split('/')[1];
        aadhar_back_key = `${rootFolder}/aadhaar_back.${ext}`;

        await R2Service.upload(
          aadharBackFile.buffer,
          aadhar_back_key,
          aadharBackFile.mimetype,
        );
      }

      if (cancelledChequeFile) {
        const isValid = await isValidImageBuffer(cancelledChequeFile.buffer);
        if (!isValid) {
          throw new BadRequestException('Invalid cancelled cheque image file');
        }

        if (cancelled_cheque_photo_key) {
          await R2Service.remove(cancelled_cheque_photo_key);
        }

        const ext = cancelledChequeFile.mimetype.split('/')[1];
        cancelled_cheque_photo_key = `${rootFolder}/cancelled_cheque.${ext}`;

        await R2Service.upload(
          cancelledChequeFile.buffer,
          cancelled_cheque_photo_key,
          cancelledChequeFile.mimetype,
        );
      }

      for (const doc of removableSupportingDocuments) {
        await R2Service.remove(doc.file_path);
      }

      const supportingDocumentsToCreate = await this.uploadSupportingDocuments(
        supportingDocumentFiles,
        rootFolder,
      );
      const removableSupportingDocumentIds = removableSupportingDocuments.map(
        (doc) => doc.id,
      );

      const updatedCustomer = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.customer.update({
          where: { id: customer_id },
          data: {
            first_name: firstName ?? customer.first_name,
            last_name: lastName ?? customer.last_name,
            email,
            phone,
            date_of_birth,
            aadhaar_number: aadhaarNumber,
            pan_number: panNumber,
            address,
            country_id,
            image: image_key,
            panImage: pan_image_key,
            aadharFront: aadhar_front_key,
            aadharBack: aadhar_back_key,
            bank_account_number: bankAccountNumber,
            bank_ifsc_code: ifscCode,
            bank_name: bankName,
            bank_branch_name: branchName,
            cancelled_cheque_photo: cancelled_cheque_photo_key,
            notes,
            income,
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

        if (removableSupportingDocumentIds.length) {
          await tx.customerSupportingDocument.deleteMany({
            where: {
              id: {
                in: removableSupportingDocumentIds,
              },
            },
          });
        }

        if (supportingDocumentsToCreate.length) {
          await tx.customerSupportingDocument.createMany({
            data: supportingDocumentsToCreate.map((doc) => ({
              customer_id,
              file_path: doc.file_path,
              file_name: doc.file_name,
              mime_type: doc.mime_type,
            })),
          });
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

  private async resolveProductEntityBySlug(slug: string) {
    try {
      const entity = await this.prisma.productEntity.findUnique({
        where: { slug },
        include: {
          products: {
            select: { slug: true, status: true },
          },
        },
      });

      if (!entity) {
        throw new BadRequestException("Invalid product entity slug");
      }

      if (entity.products.status !== "ACTIVE" || entity.status !== "ACTIVE") {
        throw new BadRequestException("Product is inactive");
      }

      return entity;
    } catch (error) {
      throw error;
    }
  }

  private async createAgentSale(
    tx: Prisma.TransactionClient,
    agent_id: bigint,
    customer_id: bigint,
    org_id: bigint,
    product_entity_id: bigint
  ) {
    return tx.agentSale.create({
      data: {
        org_id,
        agent_id,
        customer_id,
        product_entity_id,
      },
    });
  }


  private async createFixedDepositSale(tx: Prisma.TransactionClient, saleId: bigint, data: any) {
    try {
      if (!data.product_type) {
        throw new BadRequestException("Product type is required for Fixed Deposit");
      }

      return tx.productFixedDeposit.create({
        data: {
          sale_id: saleId,
          product_type: data.product_type,
          scheme_name: data.scheme_name,
          account_number: data.account_number,
          ifsc_code: data.ifsc_code,
          bank_name: data.bank_name,
          branch_name: data.branch_name,
          deposit_amount: data.deposit_amount,
          interest_rate: data.interest_rate,
          tenure_months: data.tenure_months,
          start_date: data.start_date,
          maturity_date: data.maturity_date,
          maturity_amount: data.maturity_amount,
          payout_type: data.payout_type,
          nominee_name: data.nominee_name,
          nominee_relationship: data.nominee_relationship,
          commission_percentage: data.commission_percentage,
          kyc_status: data.kyc_status,
          application_status: data.application_status,
          remarks: data.remarks,
        },
      });
    } catch (error) {
      throw error;
    }
  }


  private async createInsuranceSale(tx: Prisma.TransactionClient, saleId: bigint, data: any) {
    try {
      if (!data.insurance_type || !data.policy_type) {
        throw new BadRequestException("Insurance type is required");
      }

      return tx.productInsurance.create({
        data: {
          sale_id: saleId,
          insurance_type: data.insurance_type,
          insurance_company_name: data.insurance_company_name,
          policy_number: data.policy_number,
          sum_assured: data.sum_assured,
          premium_amount: data.premium_amount,
          premium_payment_frequency: data.premium_payment_frequency,
          policy_term_years: data.policy_term_years,
          policy_start_date: data.policy_start_date,
          policy_end_date: data.policy_end_date,
          pre_existing_diseases: data.pre_existing_diseases,
          smoking_status: data.smoking_status,
          height: data.height,
          weight: data.weight,
          vehicle_type: data.vehicle_type,
          vehicle_registration_number: data.vehicle_registration_number,
          vehicle_make: data.vehicle_make,
          vehicle_model: data.vehicle_model,
          manufacturing_year: data.manufacturing_year,
          engine_number: data.engine_number,
          chassis_number: data.chassis_number,
          fuel_type: data.fuel_type,
          cubic_capacity_cc: data.cubic_capacity_cc,
          insured_declared_value: data.insured_declared_value,
          no_claim_bonus: data.no_claim_bonus,
          nominee_name: data.nominee_name,
          nominee_relationship: data.nominee_relationship,
          commission_percentage: data.commission_percentage,
          kyc_status: data.kyc_status,
          proposal_status: data.proposal_status,
        },
      });
    } catch (error) {
      throw error;
    }
  }


  private async createMutualFundSale(tx: Prisma.TransactionClient, saleId: bigint, data: any) {
    try {
      if (!data.fund_type) {
        throw new BadRequestException("Fund type is required");
      }

      return tx.productMutualFund.create({
        data: {
          sale_id: saleId,
          fund_type: data.fund_type,
          fund_sub_type: data.fund_sub_type,
          amc_name: data.amc_name,
          scheme_name: data.scheme_name,
          folio_number: data.folio_number,
          investment_mode: data.investment_mode,
          investment_amount: data.investment_amount,
          sip_amount: data.sip_amount,
          sip_frequency: data.sip_frequency,
          start_date: data.start_date,
          units_allocated: data.units_allocated,
          nav_at_purchase: data.nav_at_purchase,
          current_value: data.current_value,
          commission_percentage: data.commission_percentage,
          commission_amount: data.commission_amount,
          kyc_status: data.kyc_status,
          fatca_status: data.fatca_status,
          nominee_name: data.nominee_name,
          nominee_relationship: data.nominee_relationship,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  private async createRealEstateSale(tx: Prisma.TransactionClient, saleId: bigint, data: any) {
    try {
      if (!data.property_type) {
        throw new BadRequestException("Property type is required");
      }

      if (!data.transaction_type) {
        throw new BadRequestException("Transaction type is required");
      }

      if (!data.property_title) {
        throw new BadRequestException("Property title is required");
      }

      if (!data.property_address) {
        throw new BadRequestException("Property address is required");
      }

      if (!data.city || !data.state || !data.pincode) {
        throw new BadRequestException("city, state and pincode are required");
      }

      return tx.productRealEstate.create({
        data: {
          sale_id: saleId,
          property_type: data.property_type,
          transaction_type: data.transaction_type,
          property_title: data.property_title,
          property_address: data.property_address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          super_build_up_area_sqft: data.super_build_up_area_sqft,
          build_up_area_sqft: data.build_up_area_sqft,
          carpet_area_sqft: data.carpet_area_sqft,
          land_area: data.land_area,
          bhk: data.bhk,
          price: data.price,
          booking_amount: data.booking_amount,
          builder_name: data.builder_name,
          rera_number: data.rera_number,
          ownership_type: data.ownership_type,
          loan_required: data.loan_required,
          commission_percentage: data.commission_percentage,
          commission_amount: data.commission_amount,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  private async createLoanSale(
    tx: Prisma.TransactionClient,
    saleId: bigint,
    data: any,
  ) {
    try {
      if (!data.loan_type) {
        throw new BadRequestException("Loan type is required");
      }

      if (!data.loan_provider_name) {
        throw new BadRequestException("Loan provider name is required");
      }

      return tx.productLoan.create({
        data: {
          sale_id: saleId,
          loan_type: data.loan_type,
          loan_provider_name: data.loan_provider_name,
          loan_account_number: data.loan_account_number,
          loan_amount: data.loan_amount,
          interest_rate: data.interest_rate,
          loan_tenure_months: data.loan_tenure_months,
          emi_amount: data.emi_amount,
          loan_start_date: data.loan_start_date,
          loan_end_date: data.loan_end_date,
          loan_status: data.loan_status,
          property_value: data.property_value,
          property_address: data.property_address,
          vehicle_type: data.vehicle_type,
          vehicle_brand: data.vehicle_brand,
          vehicle_model: data.vehicle_model,
          vehicle_onroad_price: data.vehicle_onroad_price,
          business_name: data.business_name,
          business_type: data.business_type,
          annual_turnover: data.annual_turnover,
          processing_fee: data.processing_fee,
          commission_percentage: data.commission_percentage,
          kyc_status: data.kyc_status,
          application_status: data.application_status,
          remarks: data.remarks,
        },
      });
    } catch (error) {
      throw error;
    }
  }


  async sellProduct(
    agent_id: bigint,
    customer_id: bigint,
    product_slug: string,
    sellProductDto: CommonDto
  ) {
    try {
      const payload = decryptData(sellProductDto.data);
      const { product_data } = payload;

      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org) throw new BadRequestException("Agent organization not found");

      const customer = await this.prisma.customer.findFirst({
        where: { id: customer_id, org_id: org.id },
      });

      if (!customer) throw new BadRequestException("Customer not found");
      const productEntity = await this.resolveProductEntityBySlug(product_slug);
      return this.prisma.$transaction(async (tx) => {
        const sale = await this.createAgentSale(
          tx,
          agent_id,
          customer_id,
          org.id,
          productEntity.id
        );
        switch (productEntity.products.slug) {
          case "fixed-deposit":
            await this.createFixedDepositSale(tx, sale.id, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale.id,
              productEntity.products.slug,
              product_data
            );
            break;

          case "insurance":
            await this.createInsuranceSale(tx, sale.id, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale.id,
              productEntity.products.slug,
              product_data
            );
            break;

          case "mutual-funds":
            await this.createMutualFundSale(tx, sale.id, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale.id,
              productEntity.products.slug,
              product_data
            );
            break;

          case "real-estate":
            await this.createRealEstateSale(tx, sale.id, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale.id,
              productEntity.products.slug,
              product_data
            );
            break;

          case "loan":
            await this.createLoanSale(tx, sale.id, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale.id,
              productEntity.products.slug,
              product_data
            );
            break;

          default:
            throw new BadRequestException("Unsupported product type");
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
            date_of_birth: true,
            aadhaar_number: true,
            pan_number: true,
            address: true,
            image: true,
            bank_account_number: true,
            bank_ifsc_code: true,
            bank_name: true,
            bank_branch_name: true,
            cancelled_cheque_photo: true,
            notes: true,
            income: true,
            status: true,
            country: true,
            created_at: true,
            _count: {
              select: {
                supportingDocuments: true,
              },
            },
          },
        }),
        this.prisma.customer.count({ where }),
      ]);

      const customersWithImageUrl = await Promise.all(
        customers.map(async (customer) => {
          const { _count, ...customerData } = customer;
          const [imageUrl, cancelledChequePhotoUrl] = await Promise.all([
            customer.image ? R2Service.getSignedUrl(customer.image) : null,
            customer.cancelled_cheque_photo
              ? R2Service.getSignedUrl(customer.cancelled_cheque_photo)
              : null,
          ]);

          return {
            ...customerData,
            image: imageUrl,
            cancelled_cheque_photo: cancelledChequePhotoUrl,
            supporting_documents_count: _count.supportingDocuments,
          };
        }),
      );

      return {
        Customers: customersWithImageUrl,
        Total: total,
      };
    } catch (error) {
      throw error;
    }
  }


  // async findOne(agent_id: bigint, customer_id: bigint) {
  //   try {
  //     const org = await this.prisma.organization.findUnique({
  //       where: { created_by: agent_id },
  //       select: { id: true },
  //     });

  //     if (!org?.id) {
  //       throw new BadRequestException('Agent organization not found');
  //     }

  //     const customer = await this.prisma.customer.findFirst({
  //       where: {
  //         id: customer_id,
  //         created_by: agent_id,
  //         org_id: org.id,
  //       },
  //       select: {
  //         id: true,
  //         first_name: true,
  //         last_name: true,
  //         email: true,
  //         phone: true,
  //         aadhaar_number: true,
  //         pan_number: true,
  //         address: true,
  //         image: true,
  //         panImage: true,
  //         aadharFront: true,
  //         aadharBack: true,
  //         country: true,
  //         status: true,
  //         statusHistories: {
  //           select: {
  //             id: true,
  //             old_status: true,
  //             new_status: true,
  //             reason: true,
  //             created_at: true,
  //           },
  //         },
  //         created_at: true,
  //         agentSales: {
  //           orderBy: {
  //             created_at: "desc"
  //           },
  //           select: {
  //             id: true,
  //             status: true,
  //             sale_date: true,
  //             productEntity: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //                 slug: true,
  //                 products: {
  //                   select: {
  //                     id: true,
  //                     name: true,
  //                     slug: true,
  //                   },
  //                 },
  //               },
  //             },
  //             fixedDeposit: true,
  //             insurance: true,
  //             mutualFund: true,
  //             realEstate: true,
  //           },
  //         },
  //         meetings: {
  //           select: {
  //             id: true,
  //             title: true,
  //             description: true,
  //             is_completed: true,
  //             start_time: true,
  //             end_time: true,
  //             meeting_type: true,
  //             completed_at: true,
  //             mom: true,
  //             status: true,
  //           },
  //         },
  //       },
  //     });

  //     if (!customer) {
  //       throw new NotFoundException('Customer not found.');
  //     }

  //     const [
  //       imageUrl,
  //       panImageUrl,
  //       aadharFrontUrl,
  //       aadharBackUrl,
  //     ] = await Promise.all([
  //       customer.image ? R2Service.getSignedUrl(customer.image) : null,
  //       customer.panImage ? R2Service.getSignedUrl(customer.panImage) : null,
  //       customer.aadharFront ? R2Service.getSignedUrl(customer.aadharFront) : null,
  //       customer.aadharBack ? R2Service.getSignedUrl(customer.aadharBack) : null,
  //     ]);

  //     const formatCustomerResponse = async (customer: any) => {
  //       return {
  //         ...customer,
  //         image: imageUrl,
  //         panImage: panImageUrl,
  //         aadharFront: aadharFrontUrl,
  //         aadharBack: aadharBackUrl,

  //         agentSales: await Promise.all(
  //           customer.agentSales.map(async (sale: any) => {
  //             const formattedSale: any = {
  //               id: sale.id,
  //               status: sale.status,
  //               sale_date: sale.sale_date,
  //               product: {
  //                 id: sale.productEntity.products.id,
  //                 name: sale.productEntity.products.name,
  //                 slug: sale.productEntity.products.slug,
  //                 entity: {
  //                   id: sale.productEntity.id,
  //                   name: sale.productEntity.name,
  //                   slug: sale.productEntity.slug,
  //                 },
  //               },
  //             };

  //             if (sale.fixedDeposit) {
  //               formattedSale.fixedDeposit = {
  //                 ...sale.fixedDeposit,
  //                 documents: await this.resolveDocuments(sale.fixedDeposit.documents),
  //               };
  //             }

  //             if (sale.insurance) {
  //               formattedSale.insurance = {
  //                 ...sale.insurance,
  //                 documents: await this.resolveDocuments(sale.insurance.documents),
  //               };
  //             }

  //             if (sale.mutualFund) {
  //               formattedSale.mutualFund = {
  //                 ...sale.mutualFund,
  //                 documents: await this.resolveDocuments(sale.mutualFund.documents),
  //               };
  //             }

  //             if (sale.realEstate) {
  //               formattedSale.realEstate = {
  //                 ...sale.realEstate,
  //                 documents: await this.resolveDocuments(sale.realEstate.documents),
  //               };
  //             }

  //             return formattedSale;
  //           })
  //         ),
  //       };
  //     };

  //     return await formatCustomerResponse(customer);
  //   } catch (error) {
  //     throw error;
  //   }
  // }


  async findOne(agent_id: bigint, customer_id: bigint) {
    try {
      /* -----------------------------
       * 1️⃣ ORG VALIDATION
       * ----------------------------- */
      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException('Agent organization not found');
      }

      /* -----------------------------
       * 2️⃣ CUSTOMER FETCH
       * ----------------------------- */
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
          date_of_birth: true,
          aadhaar_number: true,
          pan_number: true,
          address: true,
          bank_account_number: true,
          bank_ifsc_code: true,
          bank_name: true,
          bank_branch_name: true,
          notes: true,
          income: true,
          image: true,
          panImage: true,
          aadharFront: true,
          aadharBack: true,
          cancelled_cheque_photo: true,
          country: true,
          status: true,
          supportingDocuments: {
            orderBy: {
              created_at: 'desc',
            },
            select: {
              id: true,
              file_path: true,
              file_name: true,
              mime_type: true,
              created_at: true,
            },
          },
          statusHistories: {
            select: {
              id: true,
              old_status: true,
              new_status: true,
              reason: true,
              created_at: true,
            },
          },
          created_at: true,
          agentSales: {
            orderBy: { created_at: 'desc' },
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
              fixedDeposit: true,
              insurance: true,
              mutualFund: true,
              realEstate: true,
              loan: true,
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

      /* -----------------------------
       * 3️⃣ SIGNED CUSTOMER IMAGES
       * ----------------------------- */
      const [
        imageUrl,
        panImageUrl,
        aadharFrontUrl,
        aadharBackUrl,
        cancelledChequePhotoUrl,
      ] = await Promise.all([
        customer.image ? R2Service.getSignedUrl(customer.image) : null,
        customer.panImage ? R2Service.getSignedUrl(customer.panImage) : null,
        customer.aadharFront ? R2Service.getSignedUrl(customer.aadharFront) : null,
        customer.aadharBack ? R2Service.getSignedUrl(customer.aadharBack) : null,
        customer.cancelled_cheque_photo ? R2Service.getSignedUrl(customer.cancelled_cheque_photo) : null,
      ]);

      const supportingDocuments = await Promise.all(
        customer.supportingDocuments.map(async (doc) => ({
          id: doc.id.toString(),
          file_name: doc.file_name,
          mime_type: doc.mime_type,
          uploaded_at: doc.created_at,
          url: await R2Service.getSignedUrl(doc.file_path),
        })),
      );

      /* -----------------------------
       * 4️⃣ FETCH ALL SALE DOCUMENTS (ONCE)
       * ----------------------------- */
      const saleIds = customer.agentSales.map(s => s.id);

      const documents = await this.prisma.saleDocument.findMany({
        where: {
          sale_id: { in: saleIds },
          deleted_at: null,
        },
        select: {
          id: true,
          sale_id: true,
          file_path: true,
          file_name: true,
          mime_type: true,
          uploaded_at: true,
        },
        orderBy: { uploaded_at: 'desc' },
      });

      /* -----------------------------
       * 5️⃣ GROUP DOCUMENTS BY SALE
       * ----------------------------- */
      const documentMap = new Map<string, any[]>();

      for (const doc of documents) {
        const key = doc.sale_id.toString();
        if (!documentMap.has(key)) documentMap.set(key, []);
        documentMap.get(key)!.push(doc);
      }

      /* -----------------------------
       * 6️⃣ FORMAT RESPONSE (UNCHANGED SHAPE)
       * ----------------------------- */
      return {
        ...customer,
        image: imageUrl,
        panImage: panImageUrl,
        aadharFront: aadharFrontUrl,
        aadharBack: aadharBackUrl,
        cancelled_cheque_photo: cancelledChequePhotoUrl,
        supportingDocuments,

        agentSales: await Promise.all(
          customer.agentSales.map(async (sale: any) => {
            const saleDocs = documentMap.get(sale.id.toString()) || [];

            const resolvedDocuments = await Promise.all(
              saleDocs.map(async doc => ({
                id: doc.id.toString(),
                file_name: doc.file_name,
                mime_type: doc.mime_type,
                uploaded_at: doc.uploaded_at,
                url: await R2Service.getSignedUrl(doc.file_path),
              }))
            );

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

            if (sale.fixedDeposit) {
              formattedSale.fixedDeposit = {
                ...sale.fixedDeposit,
                documents: resolvedDocuments,
              };
            }

            if (sale.insurance) {
              formattedSale.insurance = {
                ...sale.insurance,
                documents: resolvedDocuments,
              };
            }

            if (sale.mutualFund) {
              formattedSale.mutualFund = {
                ...sale.mutualFund,
                documents: resolvedDocuments,
              };
            }

            if (sale.realEstate) {
              formattedSale.realEstate = {
                ...sale.realEstate,
                documents: resolvedDocuments,
              };
            }

            if (sale.loan) {
              formattedSale.loan = {
                ...sale.loan,
                documents: resolvedDocuments,
              };
            }

            return formattedSale;
          })
        ),
      };
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
      const { product_data } = payload;
      return this.prisma.$transaction(async (tx) => {
        // 1️⃣ Fetch sale + product info
        const sale = await tx.agentSale.findUnique({
          where: { id: sale_id },
          include: {
            productEntity: {
              include: {
                products: { select: { slug: true } },
              },
            },
          },
        });

        if (!sale) {
          throw new BadRequestException("Sale not found");
        }

        if (sale.agent_id !== agent_id) {
          throw new BadRequestException("Unauthorized sale update");
        }

        const productSlug = sale.productEntity.products.slug;
        switch (productSlug) {
          case "fixed-deposit":
            const existingFD = await tx.productFixedDeposit.findUnique({
              where: { sale_id }
            });
            await this.updateFixedDepositSale(tx, sale_id, product_data);
            const changedFDfields = this.getChangedFields(existingFD, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale_id,
              productSlug,
              changedFDfields
            );
            break;

          case "insurance":
            const existingInsurance = await tx.productInsurance.findUnique({
              where: { sale_id }
            });
            await this.updateInsuranceSale(tx, sale_id, product_data);
            const changedFields = this.getChangedFields(existingInsurance, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale_id,
              productSlug,
              changedFields
            );
            break;

          case "mutual-funds":
            const existingMF = await tx.productMutualFund.findUnique({
              where: { sale_id }
            });
            await this.updateMutualFundSale(tx, sale_id, product_data);
            const changedMFfields = this.getChangedFields(existingMF, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale_id,
              productSlug,
              changedMFfields
            );
            break;

          case "real-estate":
            const existingRE = await tx.productRealEstate.findUnique({
              where: { sale_id }
            });
            await this.updateRealEstateSale(tx, sale_id, product_data);
            const changedREfields = this.getChangedFields(existingRE, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale_id,
              productSlug,
              changedREfields
            );
            break;

          case "loan":
            const existingLoan = await tx.productLoan.findUnique({
              where: { sale_id }
            });
            await this.updateLoanSale(tx, sale_id, product_data);
            const changedLoanFields = this.getChangedFields(existingLoan, product_data);
            await this.formSuggestionService.createSuggestions(
              tx,
              agent_id,
              sale_id,
              productSlug,
              changedLoanFields
            );
            break;

          default:
            throw new BadRequestException("Unsupported product type");
        }

        return sale;
      });
    } catch (error) {
      throw error;
    }
  }

  private getChangedFields(oldData: any, newData: any) {
    const changed: Record<string, any> = {};
    for (const key in newData) {
      if (newData[key] !== oldData[key]) {
        changed[key] = newData[key];
      }
    }
    return changed;
  }

  private async updateFixedDepositSale(
    tx: Prisma.TransactionClient,
    sale_id: bigint,
    data: any
  ) {
    try {
      return tx.productFixedDeposit.update({
        where: { sale_id },
        data: {
          product_type: data?.product_type,
          scheme_name: data?.scheme_name,
          account_number: data?.account_number,
          ifsc_code: data?.ifsc_code,
          bank_name: data?.bank_name,
          branch_name: data?.branch_name,
          deposit_amount: data?.deposit_amount,
          interest_rate: data?.interest_rate,
          tenure_months: data?.tenure_months,
          start_date: data?.start_date,
          maturity_date: data?.maturity_date,
          maturity_amount: data?.maturity_amount,
          payout_type: data?.payout_type,
          nominee_name: data?.nominee_name,
          nominee_relationship: data?.nominee_relationship,
          commission_percentage: data?.commission_percentage,
          kyc_status: data?.kyc_status,
          application_status: data?.application_status,
          remarks: data?.remarks,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  private async updateInsuranceSale(
    tx: Prisma.TransactionClient,
    sale_id: bigint,
    data: any
  ) {
    try {
      return tx.productInsurance.update({
        where: { sale_id },
        data: {
          insurance_type: data?.insurance_type,
          insurance_company_name: data?.insurance_company_name,
          policy_number: data?.policy_number,
          sum_assured: data?.sum_assured,
          premium_amount: data?.premium_amount,
          premium_payment_frequency: data?.premium_payment_frequency,
          policy_term_years: data?.policy_term_years,
          policy_start_date: data?.policy_start_date,
          policy_end_date: data?.policy_end_date,
          pre_existing_diseases: data?.pre_existing_diseases,
          smoking_status: data?.smoking_status,
          height: data?.height,
          weight: data?.weight,
          vehicle_type: data?.vehicle_type,
          vehicle_registration_number: data?.vehicle_registration_number,
          vehicle_make: data?.vehicle_make,
          vehicle_model: data?.vehicle_model,
          manufacturing_year: data?.manufacturing_year,
          engine_number: data?.engine_number,
          chassis_number: data?.chassis_number,
          fuel_type: data?.fuel_type,
          cubic_capacity_cc: data?.cubic_capacity_cc,
          insured_declared_value: data?.insured_declared_value,
          no_claim_bonus: data?.no_claim_bonus,
          nominee_name: data?.nominee_name,
          nominee_relationship: data?.nominee_relationship,
          commission_percentage: data?.commission_percentage,
          kyc_status: data?.kyc_status,
          proposal_status: data?.proposal_status,
        },
      });
    } catch (error) {
      throw error;
    }
  }


  private async updateMutualFundSale(
    tx: Prisma.TransactionClient,
    sale_id: bigint,
    data: any
  ) {
    try {
      return tx.productMutualFund.update({
        where: { sale_id },
        data: {
          fund_type: data?.fund_type,
          fund_sub_type: data?.fund_sub_type,
          amc_name: data?.amc_name,
          scheme_name: data?.scheme_name,
          folio_number: data?.folio_number,
          investment_mode: data?.investment_mode,
          investment_amount: data?.investment_amount,
          sip_amount: data?.sip_amount,
          sip_frequency: data?.sip_frequency,
          start_date: data?.start_date,
          units_allocated: data?.units_allocated,
          nav_at_purchase: data?.nav_at_purchase,
          current_value: data?.current_value,
          commission_percentage: data?.commission_percentage,
          commission_amount: data?.commission_amount,
          kyc_status: data?.kyc_status,
          fatca_status: data?.fatca_status,
          nominee_name: data?.nominee_name,
          nominee_relationship: data?.nominee_relationship,
        },
      });
    } catch (error) {
      throw error;
    }
  }


  private async updateRealEstateSale(
    tx: Prisma.TransactionClient,
    sale_id: bigint,
    data: any
  ) {
    try {
      return tx.productRealEstate.update({
        where: { sale_id },
        data: {
          property_type: data?.property_type,
          transaction_type: data?.transaction_type,
          property_title: data?.property_title,
          property_address: data?.property_address,
          city: data?.city,
          state: data?.state,
          pincode: data?.pincode,
          super_build_up_area_sqft: data?.super_build_up_area_sqft,
          build_up_area_sqft: data?.build_up_area_sqft,
          carpet_area_sqft: data?.carpet_area_sqft,
          land_area: data?.land_area,
          bhk: data?.bhk,
          price: data?.price,
          booking_amount: data?.booking_amount,
          builder_name: data?.builder_name,
          rera_number: data?.rera_number,
          ownership_type: data?.ownership_type,
          loan_required: data?.loan_required,
          commission_percentage: data?.commission_percentage,
          commission_amount: data?.commission_amount,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  private async updateLoanSale(
    tx: Prisma.TransactionClient,
    sale_id: bigint,
    data: any,
  ) {
    try {
      return tx.productLoan.update({
        where: { sale_id },
        data: {
          loan_type: data?.loan_type,
          loan_provider_name: data?.loan_provider_name,
          loan_account_number: data?.loan_account_number,
          loan_amount: data?.loan_amount,
          interest_rate: data?.interest_rate,
          loan_tenure_months: data?.loan_tenure_months,
          emi_amount: data?.emi_amount,
          loan_start_date: data?.loan_start_date,
          loan_end_date: data?.loan_end_date,
          loan_status: data?.loan_status,
          property_value: data?.property_value,
          property_address: data?.property_address,
          vehicle_type: data?.vehicle_type,
          vehicle_brand: data?.vehicle_brand,
          vehicle_model: data?.vehicle_model,
          vehicle_onroad_price: data?.vehicle_onroad_price,
          business_name: data?.business_name,
          business_type: data?.business_type,
          annual_turnover: data?.annual_turnover,
          processing_fee: data?.processing_fee,
          commission_percentage: data?.commission_percentage,
          kyc_status: data?.kyc_status,
          application_status: data?.application_status,
          remarks: data?.remarks,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // async uploadDocument(
  //   agent_id: bigint,
  //   sale_id: bigint,
  //   files: any
  // ) {
  //   const org = await this.prisma.organization.findUnique({
  //     where: { created_by: agent_id },
  //     select: { id: true },
  //   });

  //   if (!org?.id) {
  //     throw new BadRequestException("Agent organization not found");
  //   }

  //   const sale = await this.prisma.agentSale.findFirst({
  //     where: {
  //       id: sale_id,
  //       org_id: org.id,
  //     },
  //     include: {
  //       productEntity: {
  //         select: {
  //           products: {
  //             select: { slug: true },
  //           },
  //         },
  //       },
  //       customer: {
  //         select: {
  //           base_folder_path: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!sale) {
  //     throw new BadRequestException("Customer sale not found");
  //   }

  //   const product_slug = sale.productEntity.products.slug;
  //   const baseimgkey = sale.customer.base_folder_path || "";

  //   const uploadedFiles = files?.documents || [];
  //   if (!uploadedFiles.length) {
  //     throw new BadRequestException("No documents provided");
  //   }

  //   const rootFolder =
  //     `${process.env.ROOT_FOLDER}` +
  //     `/${process.env.IMAGE_PATH}` +
  //     `/${process.env.USER_IMAGE_PATH}` +
  //     `${baseimgkey}/${product_slug}/`;

  //   const documentKeys: string[] = [];
  //   for (const file of uploadedFiles) {

  //     const safeName = file.originalname;

  //     const key = `${rootFolder}${safeName}`;

  //     await R2Service.upload(
  //       file.buffer,
  //       key,
  //       file.mimetype
  //     );

  //     documentKeys.push(key);
  //   }

  //   switch (product_slug) {
  //     case "fixed-deposit":
  //       await this.prisma.productFixedDeposit.update({
  //         where: { sale_id },
  //         data: {
  //           documents: { push: documentKeys },
  //         },
  //       });
  //       break;

  //     case "insurance":
  //       await this.prisma.productInsurance.update({
  //         where: { sale_id },
  //         data: {
  //           documents: { push: documentKeys },
  //         },
  //       });
  //       break;

  //     case "mutual-funds":
  //       await this.prisma.productMutualFund.update({
  //         where: { sale_id },
  //         data: {
  //           documents: { push: documentKeys },
  //         },
  //       });
  //       break;

  //     case "real-estate":
  //       await this.prisma.productRealEstate.update({
  //         where: { sale_id },
  //         data: {
  //           documents: { push: documentKeys },
  //         },
  //       });
  //       break;

  //     default:
  //       throw new BadRequestException("Unsupported product type");
  //   }
  //   return {
  //     sale_id: sale_id.toString(),
  //     product: product_slug,
  //     uploaded_documents: documentKeys,
  //   };
  // }


  private writeTempFile(buffer: Buffer, ext = '.pdf'): string {
    const tempDir = path.join(process.cwd(), `${process.env.IMAGE_PATH}/${process.env.IMAGE_TEMP_PATH}`);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPath = path.join(tempDir, `${randomUUID()}${ext}`);
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
  }

  async uploadDocumentOld(
    agent_id: bigint,
    sale_id: bigint,
    files: any
  ) {
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
     * 2️⃣ SALE + PRODUCT FETCH
     * ----------------------------- */
    const sale = await this.prisma.agentSale.findFirst({
      where: {
        id: sale_id,
        org_id: org.id,
      },
      include: {
        productEntity: {
          select: {
            products: { select: { slug: true } },
          },
        },
        customer: {
          select: {
            base_folder_path: true,
          },
        },
      },
    });

    if (!sale) {
      throw new BadRequestException("Customer sale not found");
    }

    const product_slug = sale.productEntity.products.slug;
    const baseimgkey = sale.customer.base_folder_path || "";

    /* -----------------------------
     * 3️⃣ FILE PRESENCE CHECK
     * ----------------------------- */
    const images = files?.images || [];
    const documents = files?.documents || [];

    if (!images.length && !documents.length) {
      throw new BadRequestException("No files provided");
    }

    /* -----------------------------
     * 4️⃣ YOUR EXACT ROOT FOLDER
     * ----------------------------- */
    const rootFolder =
      `${process.env.ROOT_FOLDER}` +
      `/${process.env.IMAGE_PATH}` +
      `/${process.env.USER_IMAGE_PATH}` +
      `${baseimgkey}/${product_slug}/`;

    const documentKeys: string[] = [];

    /* -----------------------------
     * 5️⃣ IMAGE VALIDATION + UPLOAD
     * ----------------------------- */
    for (const image of images) {
      const isValid = await isValidImageBuffer(image.buffer);
      if (!isValid) {
        throw new BadRequestException(
          `Invalid or corrupted image: ${image.originalname}`
        );
      }

      const safeName = image.originalname.replace(/\s+/g, "_");
      const key = `${rootFolder}${Date.now()}_${safeName}`;

      await R2Service.upload(image.buffer, key, image.mimetype);
      documentKeys.push(key);
    }

    /* -----------------------------
     * 6️⃣ DOCUMENT (PDF) VALIDATION + UPLOAD
     * ----------------------------- */
    for (const doc of documents) {
      if (doc.mimetype !== 'application/pdf') {
        throw new BadRequestException(
          `Only PDF documents are allowed: ${doc.originalname}`
        );
      }

      const tempPath = this.writeTempFile(doc.buffer, '.pdf');

      try {
        // validateSafePdf(tempPath, doc.mimetype, 5);
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }

      const safeName = doc.originalname.replace(/\s+/g, "_");
      const key = `${rootFolder}${Date.now()}_${safeName}`;

      await R2Service.upload(doc.buffer, key, doc.mimetype);
      documentKeys.push(key);
    }

    /* -----------------------------
     * 7️⃣ SAVE KEYS TO CORRECT TABLE
     * ----------------------------- */
    switch (product_slug) {
      case "fixed-deposit":
        await this.prisma.productFixedDeposit.update({
          where: { sale_id },
          data: { documents: { push: documentKeys } },
        });
        break;

      case "insurance":
        await this.prisma.productInsurance.update({
          where: { sale_id },
          data: { documents: { push: documentKeys } },
        });
        break;

      case "mutual-funds":
        await this.prisma.productMutualFund.update({
          where: { sale_id },
          data: { documents: { push: documentKeys } },
        });
        break;

      case "real-estate":
        await this.prisma.productRealEstate.update({
          where: { sale_id },
          data: { documents: { push: documentKeys } },
        });
        break;

      case "loan":
        await this.prisma.productLoan.update({
          where: { sale_id },
          data: { documents: { push: documentKeys } },
        });
        break;

      default:
        throw new BadRequestException("Unsupported product type");
    }

    /* -----------------------------
     * 8️⃣ RESPONSE
     * ----------------------------- */
    return {
      sale_id: sale_id.toString(),
      product: product_slug,
      uploaded_documents: documentKeys,
    };
  }


  async uploadDocumentNew(
    agent_id: bigint,
    sale_id: bigint,
    files: any
  ) {
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
     * 2️⃣ SALE + PRODUCT FETCH
     * ----------------------------- */
    const sale = await this.prisma.agentSale.findFirst({
      where: {
        id: sale_id,
        org_id: org.id,
      },
      include: {
        productEntity: {
          select: {
            products: { select: { slug: true } },
          },
        },
        customer: {
          select: {
            base_folder_path: true,
          },
        },
      },
    });

    if (!sale) {
      throw new BadRequestException("Customer sale not found");
    }

    const product_slug = sale.productEntity.products.slug;
    const baseimgkey = sale.customer.base_folder_path || "";

    /* -----------------------------
     * 3️⃣ PRODUCT TYPE MAPPING
     * ----------------------------- */
    const productTypeMap: Record<string, any> = {
      "fixed-deposit": "FIXED_DEPOSIT",
      "insurance": "INSURANCE",
      "mutual-funds": "MUTUAL_FUND",
      "real-estate": "REAL_ESTATE",
      "loan": "LOAN",
    };

    const product_type = productTypeMap[product_slug];

    if (!product_type) {
      throw new BadRequestException("Unsupported product type");
    }

    /* -----------------------------
     * 4️⃣ FILE PRESENCE CHECK
     * ----------------------------- */
    const images = files?.images || [];
    const documents = files?.documents || [];

    if (!images.length && !documents.length) {
      throw new BadRequestException("No files provided");
    }

    /* -----------------------------
     * 5️⃣ ROOT FOLDER
     * ----------------------------- */
    const rootFolder =
      `${process.env.ROOT_FOLDER}` +
      `/${process.env.IMAGE_PATH}` +
      `/${process.env.USER_IMAGE_PATH}` +
      `${baseimgkey}/${product_slug}/`;

    const uploadedDocs: {
      file_path: string;
      file_name: string;
      mime_type: string;
    }[] = [];

    /* -----------------------------
     * 6️⃣ IMAGE UPLOAD
     * ----------------------------- */
    for (const image of images) {
      const isValid = await isValidImageBuffer(image.buffer);
      if (!isValid) {
        throw new BadRequestException(
          `Invalid image: ${image.originalname}`
        );
      }

      const safeName = image.originalname.replace(/\s+/g, "_");
      const key = `${rootFolder}${Date.now()}_${safeName}`;

      await R2Service.upload(image.buffer, key, image.mimetype);

      uploadedDocs.push({
        file_path: key,
        file_name: safeName,
        mime_type: image.mimetype,
      });
    }

    /* -----------------------------
     * 7️⃣ DOCUMENT (PDF) UPLOAD
     * ----------------------------- */
    for (const doc of documents) {

      const tempPath = this.writeTempFile(doc.buffer, '.pdf');
      try {
        // validateSafePdf(tempPath, doc.mimetype, 5);
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }

      const safeName = doc.originalname.replace(/\s+/g, "_");
      const key = `${rootFolder}${Date.now()}_${safeName}`;

      await R2Service.upload(doc.buffer, key, doc.mimetype);

      uploadedDocs.push({
        file_path: key,
        file_name: safeName,
        mime_type: doc.mimetype,
      });
    }

    /* -----------------------------
     * 8️⃣ SAVE DOCUMENT RECORDS
     * ----------------------------- */
    await this.prisma.saleDocument.createMany({
      data: uploadedDocs.map(doc => ({
        sale_id,
        product_type,
        file_path: doc.file_path,
        file_name: doc.file_name,
        mime_type: doc.mime_type,
        uploaded_by: agent_id,
      })),
    });

    /* -----------------------------
     * 9️⃣ RESPONSE
     * ----------------------------- */
    return {
      sale_id: sale_id.toString(),
      product: product_slug,
      uploaded_documents: uploadedDocs.map(d => d.file_path),
    };
  }

  async removeSale(
    agent_id: bigint,
    sale_id: bigint
  ) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      const sale = await this.prisma.agentSale.findFirst({
        where: {
          id: sale_id,
          org_id: org.id,
        },
        include: {
          productEntity: {
            include: { products: true },
          },
        },
      });

      if (!sale) {
        throw new NotFoundException("Sale not found");
      }

      const documents = await this.prisma.saleDocument.findMany({
        where: {
          sale_id: sale_id,
          deleted_at: null,
        },
        select: {
          id: true,
          file_path: true,
        },
      });

      for (const doc of documents) {
        try {
          await R2Service.remove(doc.file_path);
        } catch (err) {
          console.error("Failed to delete R2 file:", doc.file_path);
        }
      }

      await this.prisma.$transaction(async (tx) => {
        const productSlug = sale.productEntity.products.slug;

        switch (productSlug) {
          case "fixed-deposit":
            await tx.productFixedDeposit.deleteMany({
              where: { sale_id },
            });
            break;

          case "insurance":
            await tx.productInsurance.deleteMany({
              where: { sale_id },
            });
            break;

          case "mutual-funds":
            await tx.productMutualFund.deleteMany({
              where: { sale_id },
            });
            break;

          case "real-estate":
            await tx.productRealEstate.deleteMany({
              where: { sale_id },
            });
            break;

          case "loan":
            await tx.productLoan.deleteMany({
              where: { sale_id },
            });
            break;
        }

        await tx.saleDocument.deleteMany({
          where: { sale_id },
        });

        await tx.agentSale.delete({
          where: { id: sale_id },
        });
      });

      return {
        success: true,
        message: "Sale deleted successfully",
        sale_id: sale_id.toString(),
      };
    } catch (error) {
      throw error;
    }
  }

  async removeFile(
    agent_id: bigint,
    docs_id: bigint
  ) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      const document = await this.prisma.saleDocument.findFirst({
        where: {
          id: docs_id,
          deleted_at: null,
          sale: {
            org_id: org.id,
          },
        },
        select: {
          id: true,
          file_path: true,
          sale_id: true,
        },
      });

      if (!document) {
        throw new NotFoundException("Document not found or already deleted");
      }

      await R2Service.remove(document.file_path);

      await this.prisma.saleDocument.delete({
        where: { id: docs_id },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }
}
