import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { decryptData } from '@/helper/common.helper';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TodoService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async create(agent_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);
      const { title, desc, due_date, priority } = payload;

      if (!title) {
        throw new BadRequestException("Title is required");
      }
      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      return await this.prisma.toDo.create({
        data: {
          org_id: org.id,
          agent_id,
          title,
          description: desc,
          due_date,
          priority,
        },
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
        throw new BadRequestException("Agent organization not found");
      }

      const where: any = {
        org_id: org?.id,
        agent_id,
        ...(payload.is_completed && { is_completed: payload.is_completed }),
        ...(payload.search && {
          OR: [
            { title: { contains: payload.search, mode: "insensitive" } },
            { description: { contains: payload.search, mode: "insensitive" } },
            { priority: { contains: payload.search, mode: "insensitive" } },
          ],
        }),
      };
      const [todos, total] = await Promise.all([
        this.prisma.toDo.findMany({
          where,
          ...(isPaginated && { skip, take }),
          orderBy: {
            created_at: "desc",
          },
          select: {
            id: true,
            title: true,
            description: true,
            due_date: true,
            priority: true,
            is_completed: true,
            completed_at: true,
            created_at: true,
          }
        }),
        this.prisma.toDo.count({
          where,
        }),
      ]);

      return {
        Todos: todos,
        Total: total
      };

    } catch (error) {
      throw error;
    }
  }

  async findOne(agent_id: bigint, todo_id: bigint) {
    try {
      const todo = await this.prisma.toDo.findUnique({
        where: {
          id: todo_id,
          agent_id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          due_date: true,
          priority: true,
          is_completed: true,
          completed_at: true,
          created_at: true,
        }
      })
      return todo;
    } catch (error) {
      throw error;
    }
  }

  async update(agent_id: bigint, todo_id: bigint, dto: CommonDto) {
    try {
      const payload = decryptData(dto.data);

      const org = await this.prisma.organization.findUnique({
        where: { created_by: agent_id },
        select: { id: true },
      });

      if (!org?.id) {
        throw new BadRequestException("Agent organization not found");
      }

      const existingTodo = await this.prisma.toDo.findFirst({
        where: {
          id: todo_id,
          agent_id,
          org_id: org.id,
        },
      });

      if (!existingTodo) {
        throw new NotFoundException("ToDo not found");
      }

      const updateData: any = {
        title: payload.title,
        description: payload.description,
        due_date: payload.due_date,
        priority: payload.priority,
      };

      if (typeof payload.is_completed === "boolean") {
        if (payload.is_completed !== existingTodo.is_completed) {
          updateData.is_completed = payload.is_completed;
          updateData.completed_at = payload.is_completed ? new Date() : null;
        }
      }

      return await this.prisma.toDo.update({
        where: { id: todo_id },
        data: updateData,
      });
    } catch (error) {
      throw error;
    }
  }


  async remove(agent_id: bigint, id: bigint) {
    try {
      return await this.prisma.toDo.deleteMany({
        where: {
          id,
          agent_id,
        },
      });
    } catch (error) {
      throw error;
    }
  }

}
