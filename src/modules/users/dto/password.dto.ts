import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Đổi mật khẩu khi đã đăng nhập — tương đương `PasswordUpdateDto` trong
 * [nest-admin password.dto.ts](https://github.com/buqiyuan/nest-admin/blob/main/src/modules/user/dto/password.dto.ts)
 */
export class PasswordUpdateDto {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  oldPassword: string;

  @IsString()
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Za-z])\S*$/, {
    message:
      'New password must contain at least one letter and one digit, min length 6',
  })
  @MinLength(6)
  @MaxLength(64)
  newPassword: string;
}

/** Admin đặt mật khẩu user — dùng khi có route quản trị (giữ DTO sẵn). */
export class UserPasswordDto {
  @IsString()
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Za-z])\S*$/, {
    message: 'Invalid password format',
  })
  @MinLength(6)
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
