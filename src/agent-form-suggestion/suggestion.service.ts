import { Injectable } from '@nestjs/common';
import { CreateAgentFormSuggestionDto } from './dto/create-agent-form-suggestion.dto';
import { UpdateAgentFormSuggestionDto } from './dto/update-agent-form-suggestion.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { SaleProductType } from '@generated/prisma';
import { SUGGESTION_FIELDS } from './suggestion-fields.config';

@Injectable()
export class FormSuggestionService {
  constructor(
    private prisma: PrismaService,
  ) { }

  // async createSuggestions(
  //   agentId: bigint,
  //   saleId: bigint,
  //   payload: any
  // ) {
  //   try {
  //     const { product_type, ...fields } = payload;
  //     const suggestions = Object.entries(payload)
  //       .filter(([_, value]) => value !== null && value !== undefined && value !== '')
  //       .map(([field, value]) => ({
  //         sale_id: saleId,
  //         agent_id: agentId,
  //         product_type,
  //         field_name: field,
  //         field_value: String(value),
  //       }));

  //     for (const suggestion of suggestions) {
  //       const existing = await this.prisma.agentFormSuggestion.findFirst({
  //         where: {
  //           agent_id: suggestion.agent_id,
  //           product_type: suggestion.product_type,
  //           field_name: suggestion.field_name,
  //           field_value: suggestion.field_value,
  //         },
  //       });

  //       if (existing) {
  //         await this.prisma.agentFormSuggestion.update({
  //           where: { id: existing.id },
  //           data: {
  //             usage_count: { increment: 1 },
  //             last_used_at: new Date(),
  //           },
  //         });
  //       } else {
  //         await this.prisma.agentFormSuggestion.create({
  //           data: suggestion,
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // }


  async createSuggestions(
    agentId: bigint,
    saleId: bigint,
    // payload: any
    productType: SaleProductType,
    productData: Record<string, any>
  ) {
    try {
      // const { productType, ...productData } = payload;

      const allowedFields = SUGGESTION_FIELDS[productType];

      if (!allowedFields) return;

      const suggestions: any = [];

      for (const field of allowedFields) {

        const value = productData[field];

        if (!value) continue;

        suggestions.push({
          sale_id: saleId,
          agent_id: agentId,
          product_type: productType,
          field_name: field,
          field_value: String(value).trim()
        });

      }

      for (const suggestion of suggestions) {

        const existing = await this.prisma.agentFormSuggestion.findFirst({
          where: {
            agent_id: suggestion.agent_id,
            product_type: suggestion.product_type,
            field_name: suggestion.field_name,
            field_value: suggestion.field_value
          }
        });

        if (existing) {

          await this.prisma.agentFormSuggestion.update({
            where: { id: existing.id },
            data: {
              usage_count: { increment: 1 },
              last_used_at: new Date()
            }
          });

        } else {

          await this.prisma.agentFormSuggestion.create({
            data: suggestion
          });

        }

      }

    } catch (error) {
      throw error;
    }
  }


  async getSuggestions(
    agentId: bigint,
    product?: string,
    field?: string,
  ) {
    try {
      const where: any = {
        agent_id: agentId,
      };
      if (product) {
        where.product_type = product;
      }

      if (field) {
        where.field_name = field;
      }

      const suggestions = await this.prisma.agentFormSuggestion.findMany({
        where,
        orderBy: [
          { usage_count: "desc" },
          { last_used_at: "desc" },
        ],
        select: {
          product_type: true,
          field_name: true,
          field_value: true,
        },
      });

      if (field) {
        return suggestions.map(s => s.field_value);
      }

      const grouped: Record<string, any> = {};
      for (const row of suggestions) {
        if (!grouped[row.product_type]) {
          grouped[row.product_type] = {};
        }

        if (!grouped[row.product_type][row.field_name]) {
          grouped[row.product_type][row.field_name] = [];
        }
        grouped[row.product_type][row.field_name].push(row.field_value);
      }

      return grouped;
    } catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} agentFormSuggestion`;
  }

  update(id: number, updateAgentFormSuggestionDto: UpdateAgentFormSuggestionDto) {
    return `This action updates a #${id} agentFormSuggestion`;
  }

  remove(id: number) {
    return `This action removes a #${id} agentFormSuggestion`;
  }
}
