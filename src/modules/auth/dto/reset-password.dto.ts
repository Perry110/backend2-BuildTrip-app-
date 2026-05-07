import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token required' })
  token: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password phải chứa ít nhất 1 chữ cái và 1 chữ số',
  })
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  newPassword: string;
}
