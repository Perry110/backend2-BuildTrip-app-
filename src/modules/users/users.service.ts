import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { ResponseCommon } from '../../common/dto/response.dto';
import { User } from './entities/user.entity';
import { AccountUpdateDto } from './dto/account-update.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { PasswordUpdateDto, UserPasswordDto } from './dto/password.dto';
import { QueryUsersDto } from './dto/query-users.dto';

export type PublicUserProfile = {
  id: string;
  username: string;
  email: string;
  role: User['role'];
  phone: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  tagPreferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUserCard = {
  id: string;
  username: string;
  city: string | null;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  private toPublicProfile(user: User): PublicUserProfile {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      city: user.city,
      country: user.country,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      tagPreferences: user.tagPreferences ?? {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toPublicUserCard(user: User): PublicUserCard {
    return {
      id: user.id,
      username: user.username,
      city: user.city,
      country: user.country,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    };
  }

  /** Tương đương `UserService.getAccountInfo` (nest-admin). */
  async getAccountInfo(userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }
    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'Profile retrieved',
      this.toPublicProfile(user),
    );
  }

  /** Tương đương `UserService.updateAccountInfo` (nest-admin). */
  async updateAccountInfo(userId: string, dto: AccountUpdateDto) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    if (dto.city !== undefined) {
      user.city = dto.city;
    }
    if (dto.country !== undefined) {
      user.country = dto.country;
    }
    if (dto.bio !== undefined) {
      user.bio = dto.bio;
    }
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }
    if (dto.tagPreferences !== undefined) {
      user.tagPreferences = dto.tagPreferences;
    }

    await user.save();

    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'Profile updated',
      this.toPublicProfile(user),
    );
  }

  /** Tương đương `UserService.updatePassword` (nest-admin account). */
  async updatePassword(userId: string, dto: PasswordUpdateDto) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }

    const match = await bcrypt.compare(dto.oldPassword, user.hashedPassword);
    if (!match) {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.BAD_REQUEST,
          false,
          'Current password is incorrect',
          null,
          { reason: 'PASSWORD_MISMATCH' },
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    const saltRounds = 10;
    user.hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);
    await user.save();

    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'Password updated successfully',
      null,
    );
  }

  async findAllUsers(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (query.role !== undefined) {
      where.role = query.role;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.keyword?.trim()) {
      const kw = `%${query.keyword.trim()}%`;
      (where as { [Op.or]?: unknown })[Op.or] = [
        { username: { [Op.iLike]: kw } },
        { email: { [Op.iLike]: kw } },
      ];
    }

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return new ResponseCommon(HttpStatus.OK, true, 'Users list', {
      list: rows.map((u) => this.toPublicProfile(u)),
      total: count,
      page,
      pageSize,
    });
  }

  async findUserById(id: string) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }
    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'User retrieved',
      this.toPublicProfile(user),
    );
  }

  async findUserByUsername(username: string) {
    const normalized = username.trim().toLowerCase();
    const user = await this.userModel.findOne({
      where: { username: normalized },
    });
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }
    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'User retrieved',
      this.toPublicProfile(user),
    );
  }

  async findPublicUserById(id: string) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }
    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'Public user retrieved',
      this.toPublicUserCard(user),
    );
  }

  async findPublicUserByUsername(username: string) {
    const normalized = username.trim().toLowerCase();
    const user = await this.userModel.findOne({
      where: { username: normalized },
    });
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }
    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'Public user retrieved',
      this.toPublicUserCard(user),
    );
  }

  async createUser(dto: AdminCreateUserDto) {
    const username = dto.username.toLowerCase();
    const email = dto.email.toLowerCase();

    const existingUser = await this.userModel.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      const conflictingField =
        existingUser.email === email ? 'email' : 'username';
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.CONFLICT,
          false,
          `${field} already exists`,
          null,
          { conflictingField },
        ),
        HttpStatus.CONFLICT,
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.userModel.create({
      username,
      email,
      hashedPassword,
      role: dto.role ?? 'user',
    });

    return new ResponseCommon(
      HttpStatus.CREATED,
      true,
      'User created',
      this.toPublicProfile(user),
    );
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }

    const nextUsername =
      dto.username !== undefined ? dto.username.toLowerCase() : undefined;
    const nextEmail =
      dto.email !== undefined ? dto.email.toLowerCase() : undefined;

    if (nextUsername !== undefined || nextEmail !== undefined) {
      const conflict = await this.userModel.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            ...(nextUsername ? [{ username: nextUsername }] : []),
            ...(nextEmail ? [{ email: nextEmail }] : []),
          ],
        },
      });
      if (conflict) {
        const field =
          nextEmail && conflict.email === nextEmail ? 'Email' : 'Username';
        throw new HttpException(
          new ResponseCommon(
            HttpStatus.CONFLICT,
            false,
            `${field} already exists`,
            null,
          ),
          HttpStatus.CONFLICT,
        );
      }
    }

    if (nextUsername !== undefined) {
      user.username = nextUsername;
    }
    if (nextEmail !== undefined) {
      user.email = nextEmail;
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    if (dto.city !== undefined) {
      user.city = dto.city;
    }
    if (dto.country !== undefined) {
      user.country = dto.country;
    }
    if (dto.bio !== undefined) {
      user.bio = dto.bio;
    }
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }
    if (dto.tagPreferences !== undefined) {
      user.tagPreferences = dto.tagPreferences;
    }

    await user.save();

    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'User updated',
      this.toPublicProfile(user),
    );
  }

  async deleteUser(id: string, actorId?: string) {
    if (actorId && actorId === id) {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.BAD_REQUEST,
          false,
          'Cannot delete your own account',
          null,
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }

    await user.destroy();

    return new ResponseCommon(HttpStatus.OK, true, 'User deleted', null);
  }

  async forceUpdatePassword(id: string, dto: UserPasswordDto) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(
        new ResponseCommon(HttpStatus.NOT_FOUND, false, 'User not found', null),
      );
    }

    const saltRounds = 10;
    user.hashedPassword = await bcrypt.hash(dto.password, saltRounds);
    await user.save();

    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'Password updated by admin',
      null,
    );
  }
}
