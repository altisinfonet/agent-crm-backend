import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonDto } from 'src/auth/dto/common.dto';
import { decryptData, hashPassword } from 'src/helper/common.helper';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
  ) { }
  create(createUserDto: CommonDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  async getCurrentUser(userId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_no: true,
        image: true,
        provider: true,
        kyc_status: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        is_deleted: true,
        is_temporary: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserProfile(userId: bigint, commonDto: CommonDto) {
    try {
      const payload = decryptData(commonDto.data);

      const {
        email,
        phone_no,
        first_name,
        last_name,
        old_password,
        new_password,
      } = payload;

      const findUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!findUser) {
        throw new BadRequestException('User not found');
      }

      const updateData: any = {};

      if (email) updateData.email = email.toLowerCase();
      if (phone_no) updateData.phone_no = phone_no;
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;

      const hasOld = !!old_password;
      const hasNew = !!new_password;

      if (hasOld || hasNew) {
        if (!hasOld) {
          throw new BadRequestException('Old password is required');
        }

        if (!hasNew) {
          throw new BadRequestException('New password is required');
        }

        if (!findUser.password) {
          throw new BadRequestException('Password not set for this account');
        }

        const isMatch = await bcrypt.compare(old_password, findUser.password);

        if (!isMatch) {
          throw new BadRequestException('Old password is incorrect');
        }
        updateData.password = await hashPassword(new_password);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      await this.prisma.userSession.updateMany({
        where: {
          user_id: userId,
          revoked: false,
        },
        data: {
          revoked: true,
          last_used_at: new Date(),
        },
      });
      return this.getCurrentUser(userId);
    } catch (error) {
      throw error
    }
  }

  async updateProfileImage(userId: bigint, dto: any, file) {
    try {
      const imageFileName = file?.filename ?? "";
      let dataToUpdate: any = {};

      if (Boolean(dto?.delete)) {
        dataToUpdate.image = null;
      } else if (imageFileName !== "") {
        dataToUpdate.image = `${file?.path}`;
      }

      const res = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: dataToUpdate,
      });

      const { password, ...user } = res;
      return user;
    } catch (error) {
      throw error
    }
  }


  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
