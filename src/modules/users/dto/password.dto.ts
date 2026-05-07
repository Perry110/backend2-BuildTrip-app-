import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Đổi mật khẩu khi đã đăng nhập — tương đương `PasswordUpdateDto` trong
 * [nest-admin password.dto.ts](https://github.com/buqiyuan/nest-admin/blob/main/src/modules/user/dto/password.dto.ts)
 */
export class PasswordUpdateDto {
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  oldPassword: string;

  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password phải chứa ít nhất 1 chữ cái và 1 chữ số',
  })
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  @MaxLength(64)
  newPassword: string;
}

/** Admin đặt mật khẩu user — dùng khi có route quản trị (giữ DTO sẵn). */
export class UserPasswordDto {
  @IsString()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password phải chứa ít nhất 1 chữ cái và 1 chữ số',
  })
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  @MaxLength(64)
  password: string;
}

/** Kiểm tra username tồn tại — dùng khi có API `exist`. */
export class UserExistDto {
  @IsString()
  @Matches(/^[\w-]{4,16}$/)
  @MinLength(6)
  @MaxLength(16)
  username: string;
}
