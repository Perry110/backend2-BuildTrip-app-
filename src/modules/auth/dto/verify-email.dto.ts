import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Token là bắt buộc' })
  token: string;
}
