import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
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
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password phải chứa ít nhất 1 chữ cái và 1 chữ số',
  })
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  password: string;
}
