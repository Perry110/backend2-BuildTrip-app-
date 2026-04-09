import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token required' })
  token: string;

  @IsString()
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Za-z])\S*$/, {
    message:
      'New password must contain at least one letter and one digit, min length 6',
  })
  @MinLength(6, { message: 'Password phải có ít nhất 6 ký tự' })
  newPassword: string;
}
