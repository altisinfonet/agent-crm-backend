import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData } from 'src/helper/common.helper';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) { }

  async createModule(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);

      const lastModule = await this.prisma.fAQModule.findFirst({
        orderBy: { rank: 'desc' },
      });
      const newRank = lastModule ? lastModule.rank + BigInt(1) : BigInt(1);
      const res = await this.prisma.fAQModule.create({
        data: {
          name: payload.name,
          desc: payload.desc,
          rank: newRank,
        },
      });
      return res;
    } catch (error) {
      throw error
    }
  }

  async findAllModule(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
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
      if (payload?.status) {
        conditions.push({
          OR: [
            { status_id: payload.status },
          ]
        });
      }
      const page = payload?.page || 1
      const limit = payload?.limit || 1000
      let faqModule: any;
      if (payload && payload.page && payload.limit) {
        faqModule = await this.prisma.fAQModule.findMany({
          skip: (page - 1) * limit,
          take: limit,
          where: {
            AND: conditions
          },
          orderBy: {
            rank: "asc"
          },
          select: {
            id: true,
            name: true,
            desc: true,
            rank: true,
            status: true,
            _count: {
              select: {
                FAQ: true,
              }
            },
            created_at: true,
          }
        })
      } else {
        faqModule = await this.prisma.fAQModule.findMany({
          where: {
            AND: conditions,
          },
          orderBy: {
            rank: "asc"
          },
          select: {
            id: true,
            name: true,
            desc: true,
            rank: true,
            status: true,
            _count: {
              select: {
                FAQ: true,
              }
            },
            created_at: true,
          }
        })
      }
      const total = await this.prisma.fAQModule.count({
        where: {
          AND: conditions
        },
      });
      return { Total: total, FaqModules: faqModule };
    } catch (error) {
      throw error
    }
  }

  async findOneModule(module_id: bigint) {
    try {
      const faqModule = await this.prisma.fAQModule.findUnique({
        where: {
          id: module_id,
        },
        select: {
          id: true,
          name: true,
          desc: true,
          rank: true,
          status: true,
          created_at: true,
        }
      })
      return faqModule;
    } catch (error) {
      throw error
    }
  }

  async updateModule(module_id: bigint, updateFaqDto: CommonDto) {
    try {
      const payload = decryptData(updateFaqDto.data);

      let { name, desc, status_id, rank } = payload;

      const currentModule = await this.prisma.fAQModule.findUnique({
        where: { id: module_id },
      });

      if (!currentModule) {
        throw new BadRequestException(`FAQ Module not found.`);
      }

      const currentRank = currentModule.rank;
      const updatedData: any = {
        ...(name && { name }),
        ...(desc && { desc }),
        ...(status_id && { status_id }),
      };

      if (rank && currentRank !== BigInt(rank)) {
        const highestRankModule = await this.prisma.fAQModule.findFirst({
          orderBy: { rank: 'desc' },
          select: { rank: true },
        });

        const highestRank = highestRankModule ? highestRankModule.rank : BigInt(0);

        if (rank > highestRank) {
          rank = Number(highestRank);
        }

        if (currentRank < rank) {
          await this.prisma.fAQModule.updateMany({
            where: {
              rank: {
                gt: currentRank,
                lte: rank,
              },
            },
            data: {
              rank: { decrement: BigInt(1) },
            },
          });
        } else {
          await this.prisma.fAQModule.updateMany({
            where: {
              rank: {
                gte: rank,
                lt: currentRank,
              },
            },
            data: {
              rank: { increment: BigInt(1) },
            },
          });
        }
        updatedData.rank = rank;
      }

      const updatedModule = await this.prisma.fAQModule.update({
        where: { id: module_id },
        data: updatedData,
      });

      return updatedModule;
    }
    catch (error) {
      throw error
    }
  }

  async removeModule(module_id: bigint) {
    try {
      if (!module_id) {
        throw new BadRequestException("No module ID provided for deletion.");
      }

      const moduleToDelete = await this.prisma.fAQModule.findUnique({
        where: { id: module_id },
        select: { rank: true },
      });

      if (!moduleToDelete) {
        throw new BadRequestException("FAQ Module not found.");
      }
      const deletedRank = moduleToDelete.rank;

      const delModule = await this.prisma.fAQModule.delete({
        where: { id: module_id },
      });

      await this.prisma.fAQModule.updateMany({
        where: {
          rank: { gt: deletedRank },
        },
        data: {
          rank: {
            decrement: BigInt(1),
          },
        },
      });
      return delModule;
    } catch (error) {
      throw error;
    }
  }


  async create(dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      if (!payload.module_id) {
        throw new BadRequestException("Select a FAQ category.")
      }
      const lastFAQ = await this.prisma.fAQ.findFirst({
        where: {
          module_id: payload.module_id,
        },
        orderBy: {
          rank: 'desc',
        },
      });
      const newRank = lastFAQ ? lastFAQ.rank + BigInt(1) : BigInt(1);

      const res = await this.prisma.fAQ.create({
        data: {
          question: payload.question,
          answer: payload.answer,
          rank: newRank,
          module_id: payload.module_id,
          status: "ACTIVE",
        },
      });

      return res
    } catch (error) {
      throw error
    }
  }

  async findAll(module_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      let conditions: any[] = [];
      let searchWord = '';
      if (payload?.search) {
        let str = (payload?.search).trim();
        searchWord = str;
        conditions.push({
          OR: [
            { question: { contains: searchWord, mode: "insensitive" } },
            { answer: { contains: searchWord, mode: "insensitive" } },
          ]
        });
      }
      if (payload?.status) {
        conditions.push({
          OR: [
            { status_id: payload.status },
          ]
        });
      }
      const page = payload?.page || 1
      const rowsPerPage = payload?.rowsPerPage || 1000
      let faq: any;
      if (payload && payload.page && payload.rowsPerPage) {
        faq = await this.prisma.fAQ.findMany({
          skip: (page - 1) * rowsPerPage,
          take: rowsPerPage,
          where: {
            module_id,
            AND: conditions
          },
          orderBy: {
            rank: "asc"
          },
          select: {
            id: true,
            question: true,
            answer: true,
            rank: true,
            status: true,
            created_at: true,
          }
        })
      } else {
        faq = await this.prisma.fAQ.findMany({
          where: {
            module_id,
            AND: conditions,
          },
          orderBy: {
            rank: "asc"
          },
          select: {
            id: true,
            question: true,
            answer: true,
            rank: true,
            status: true,
            created_at: true,
          }
        })
      }
      const module = await this.prisma.fAQModule.findUnique({
        where: {
          id: module_id,
        },
      });
      const total = await this.prisma.fAQ.count({
        where: {
          module_id,
          AND: conditions
        },
      });
      return { Total: total, FAQ: faq, Module: module };
    } catch (error) {
      throw error
    }
  }

  async findOne(faq_id: bigint) {
    try {
      const faq = await this.prisma.fAQ.findUnique({
        where: {
          id: faq_id,
        },
        select: {
          id: true,
          question: true,
          answer: true,
          rank: true,
          status: true,
          created_at: true,
        }
      })
      return faq;
    } catch (error) {
      throw error
    }
  }

  async update(id: bigint, updateFaqDto: CommonDto) {
    try {
      const payload = decryptData(updateFaqDto.data);
      const { rank, ...updateFields } = payload;

      const currentFAQ = await this.prisma.fAQ.findUnique({
        where: { id },
      });

      if (!currentFAQ) {
        throw new BadRequestException(`FAQ not found.`);
      }

      const currentRank = currentFAQ.rank;
      if (rank && currentRank !== BigInt(rank)) {
        if (currentRank < rank) {
          await this.prisma.fAQ.updateMany({
            where: {
              module_id: currentFAQ.module_id,
              rank: {
                gt: currentRank,
                lte: rank,
              },
            },
            data: {
              rank: { decrement: BigInt(1) },
            },
          });
        } else {
          await this.prisma.fAQ.updateMany({
            where: {
              module_id: currentFAQ.module_id,
              rank: {
                gte: rank,
                lt: currentRank,
              },
            },
            data: {
              rank: { increment: BigInt(1) },
            },
          });
        }
      }

      const updatedFAQ = await this.prisma.fAQ.update({
        where: { id },
        data: {
          ...updateFields,
          ...(rank && { rank: rank }),
        },
      });

      return updatedFAQ
    } catch (error) {
      throw error
    }
  }

  async remove(faq_id: bigint) {
    try {
      if (!faq_id) {
        throw new BadRequestException("No FAQ ID provided for deletion.");
      }

      const faqToDelete = await this.prisma.fAQ.findUnique({
        where: {
          id: faq_id,
        },
        select: {
          rank: true,
        },
      });

      if (!faqToDelete) {
        throw new BadRequestException("FAQ not found.");
      }

      const deletedFaq = await this.prisma.fAQ.delete({
        where: {
          id: faq_id,
        },
      });

      await this.prisma.fAQ.updateMany({
        where: {
          rank: {
            gt: faqToDelete.rank,
          },
        },
        data: {
          rank: {
            decrement: BigInt(1),
          },
        },
      });

      return deletedFaq;
    } catch (error) {
      throw error;
    }
  }

}

