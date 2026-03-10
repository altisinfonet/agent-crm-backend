import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonDto } from '@/auth/dto/common.dto';
import { createNotification, decryptData } from '@/common/helper/common.helper';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
import { NotificationService } from '@/notification/notification.service';

@Injectable()
export class TodoService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private notificationService: NotificationService
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

      const todo = await this.prisma.toDo.create({
        data: {
          org_id: org.id,
          agent_id,
          title,
          description: desc,
          due_date,
          priority,
        },
      });

      setImmediate(async () => {
        try {
          const TodoTitle = "Todo Created"
          const TodoDesc = `Title: ${title}\n Description :${desc}`
          await createNotification(
            agent_id,
            'Todo',
            TodoTitle,
            TodoDesc,
            {
              todo_id: todo.id,
              priority: todo.priority,
              action: 'created',
            }
          );

          await this.notificationService.sendUserPushNotification(
            agent_id,
            TodoTitle,
            TodoDesc,
            {
              todo_id: todo.id,
              priority: todo.priority,
              action: 'created',
            },
          );
        } catch (error) {
          console.error("Error sending metting email", error);
        }
      });
      return todo;
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
        ...(payload.status && { priority: payload.status }),
        ...(payload.search && {
          OR: [
            { title: { contains: payload.search, mode: "insensitive" } },
            { description: { contains: payload.search, mode: "insensitive" } },
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
        description: payload.desc,
        due_date: payload.due_date,
        priority: payload.priority,
      };

      if (typeof payload.is_completed === "boolean") {
        if (payload.is_completed !== existingTodo.is_completed) {
          updateData.is_completed = payload.is_completed;
          updateData.completed_at = payload.is_completed ? new Date() : null;
        }
      }

      const isPriorityUpdated =
        payload.priority !== undefined &&
        payload.priority !== existingTodo.priority;

      const updatedTodo = await this.prisma.toDo.update({
        where: { id: todo_id },
        data: updateData,
      });

      if (isPriorityUpdated) {
        setImmediate(async () => {
          try {
            const todoTitle = "Todo Priority Updated";
            const todoDesc = `Priority for "${updatedTodo.title}" changed from ${existingTodo.priority} to ${updatedTodo.priority}.`;

            await createNotification(
              agent_id,
              'Todo',
              todoTitle,
              todoDesc,
              {
                todo_id: updatedTodo.id,
                priority: updatedTodo.priority,
                action: 'updated',
              }
            );

            await this.notificationService.sendUserPushNotification(
              agent_id,
              todoTitle,
              todoDesc,
              {
                todo_id: updatedTodo.id,
                priority: updatedTodo.priority,
                action: 'updated',
              },
            );
          } catch (error) {
            console.error("Error sending todo priority update notification", error);
          }
        });
      }

      return updatedTodo;
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
