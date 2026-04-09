# Module Auth — cấu trúc đầy đủ

Mỗi phần tương ứng một “lớp” trong kiến trúc Nest (tương tự [nest-admin](https://github.com/buqiyuan/nest-admin)):

| Thành phần | Vai trò |
|------------|---------|
| **auth.module.ts** | Khai báo imports (Passport, Sequelize), providers, **APP_GUARD** (Jwt + Roles), exports. |
| **auth.controller.ts** | HTTP routes. Route công khai dùng **`@Public()`**. Ví dụ bảo vệ: `GET /api/auth/me` + **`@CurrentUser()`**. |
| **auth.service.ts** | Nghiệp vụ: register, login, logout, refresh. |
| **services/jwt-token.service.ts** | Ký / verify JWT (access + refresh) bằng `jsonwebtoken`. |
| **entities/** | ORM entity (Sequelize): `User` — bảng `users` (không dùng bảng `sessions`; refresh JWT + Redis blacklist). |
| **dto/** | `class-validator` cho body (thay Joi middleware cũ). |
| **strategies/jwt.strategy.ts** | Passport **`passport-jwt`**: đọc Bearer token, verify secret, **check Redis blacklist**. |
| **guards/jwt-auth.guard.ts** | `AuthGuard('jwt')` + bỏ qua nếu **`@Public()`**. |
| **guards/roles.guard.ts** | Chỉ kiểm tra khi có **`@Roles('admin', ...)`**. |
| **decorators/** | `@Public()`, `@Roles()`, `@CurrentUser()`. |

## Luồng bảo vệ global

1. `JwtAuthGuard` — nếu không `@Public()` → cần JWT hợp lệ (strategy + Redis).  
2. `RolesGuard` — nếu có `@Roles(...)` → so khớp `req.user.role`.

## Module sau này (trips, places, …)

- Import `AuthModule` (đã export guard) hoặc chỉ dùng global guards từ `AuthModule`.  
- Route công khai: `@Public()`.  
- Chỉ admin: `@Roles('admin')` trên handler hoặc controller.
