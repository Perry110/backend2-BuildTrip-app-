import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Cập nhật tài khoản đang đăng nhập — tương đương `AccountUpdateDto` trong nest-admin,
 * map sang các cột profile của `User` (Sequelize) trong project này.
 */
export class AccountUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsObject()
  tagPreferences?: Record<string, unknown>;
}
