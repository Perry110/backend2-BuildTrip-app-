import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminCreateUserDto {
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  username: string;

  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password phải có ít nhất 6 ký tự' })
  password: string;

  @IsOptional()
  @IsIn(['user', 'member', 'admin'])
  role?: 'user' | 'member' | 'admin';
}
