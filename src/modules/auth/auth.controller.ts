import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ResponseCommon } from '../../common/dto/response.dto';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtUserPayload } from './services/jwt-token.service';

/**
 * Global prefix `api` → /api/auth/*
 * Các route login/register/... dùng @Public() để JWT guard bỏ qua.
 */
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  logout(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: LogoutDto,
  ) {
    return this.authService.logout(authorization, body.refreshToken);
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /** Ví dụ route cần JWT — JwtAuthGuard + JwtStrategy (payload → req.user). */
  @Get('me')
  getMe(@CurrentUser() user: JwtUserPayload) {
    return new ResponseCommon(HttpStatus.OK, true, 'Success', user);
  }
}
// Chỉ đc return kết quả của service
