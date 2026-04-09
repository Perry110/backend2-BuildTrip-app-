import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập username' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  username: string;

  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password phải có ít nhất 6 ký tự' })
  password: string;
}
