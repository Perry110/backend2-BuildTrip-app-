import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;
}
