import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { ResponseCommon } from '../../common/dto/response.dto';
import { NotificationService } from '../notification/services/notification.service';
import { User } from '../users/entities/user.entity';
import { RedisService } from '../../shared/redis/redis.service';
import { JwtTokenService } from './services/jwt-token.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly loginMaxAttempts = 5;
  private readonly loginWindowSeconds = 15 * 60;
  private readonly loginLockSeconds = 15 * 60;
  private readonly passwordResetTokenTtlSeconds = 15 * 60;
  private readonly emailVerificationTokenTtlSeconds = 24 * 60 * 60;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtTokenService: JwtTokenService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  private toUserResponse(user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }

  private getFrontendBaseUrl() {
    return process.env.FRONTEND_URL?.trim() || 'http://localhost:3000';
  }

  private getBackendBaseUrl() {
    return process.env.BACKEND_URL?.trim() || 'http://localhost:5002';
  }

  private getPasswordResetBaseUrl() {
    return process.env.RESET_PASSWORD_URL?.trim()
      || `${this.getFrontendBaseUrl()}/reset-password`;
  }

  private async issueEmailVerification(user: User) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await this.redisService
      .getClient()
      .setex(
        `auth:email-verify:${tokenHash}`,
        this.emailVerificationTokenTtlSeconds,
        user.id,
      );

    const verifyBaseUrl =
      process.env.EMAIL_VERIFY_URL?.trim() ||
      `${this.getBackendBaseUrl()}/api/auth/verify-email`;
    const separator = verifyBaseUrl.includes('?') ? '&' : '?';
    const verifyUrl = `${verifyBaseUrl}${separator}token=${rawToken}`;
    await this.notificationService.notifyVerifyEmail({
      to: user.email,
      verifyUrl,
    });
    return verifyUrl;
  }

  private loginAttemptKey(email: string) {
    return `auth:login:attempt:${email}`;
  }

  private loginLockKey(email: string) {
    return `auth:login:lock:${email}`;
  }

  private async throwIfLoginLocked(email: string) {
    const redis = this.redisService.getClient();
    const lockKey = this.loginLockKey(email);
    const locked = await redis.get(lockKey);
    if (!locked) {
      return;
    }
    const ttl = await redis.ttl(lockKey);
    throw new HttpException(
      new ResponseCommon(
        HttpStatus.TOO_MANY_REQUESTS,
        false,
        'Too many login attempts. Please try again later.',
        null,
        { reason: 'LOGIN_LOCKED', retryAfterSeconds: ttl > 0 ? ttl : undefined },
      ),
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private async recordFailedLogin(email: string) {
    const redis = this.redisService.getClient();
    const attemptsKey = this.loginAttemptKey(email);
    const lockKey = this.loginLockKey(email);
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
      await redis.expire(attemptsKey, this.loginWindowSeconds);
    }
    if (attempts >= this.loginMaxAttempts) {
      await redis.setex(lockKey, this.loginLockSeconds, '1');
      await redis.del(attemptsKey);
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.TOO_MANY_REQUESTS,
          false,
          'Too many login attempts. Please try again later.',
          null,
          { reason: 'LOGIN_RATE_LIMITED', retryAfterSeconds: this.loginLockSeconds },
        ),
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async clearLoginAttempts(email: string) {
    const redis = this.redisService.getClient();
    await redis.del(this.loginAttemptKey(email));
    await redis.del(this.loginLockKey(email));
  }

  async register(dto: RegisterDto) {
    const username = dto.username.toLowerCase();
    const email = dto.email.toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      const conflictingField =
        existingUser.email === email ? 'email' : 'username';
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.CONFLICT,
          false,
          `${field} already exists`,
          null,
          {
            conflictingField,
            detail: `${conflictingField}_already_registered`,
          },
        ),
        HttpStatus.CONFLICT,
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const newUser = this.userRepository.create({
      username,
      email,
      hashedPassword,
      role: 'user',
      isEmailVerified: false,
      emailVerifiedAt: null,
    });
    await this.userRepository.save(newUser);
    await this.issueEmailVerification(newUser);
    this.logger.log(`New user registered: ${newUser.role}`);

    return new ResponseCommon(
      HttpStatus.CREATED,
      true,
      'User registered successfully. Please verify your email.',
      {
        user: this.toUserResponse(newUser),
      },
    );
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    await this.throwIfLoginLocked(email);

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      await this.recordFailedLogin(email);
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid email or password',
          null,
          { reason: 'USER_NOT_FOUND' },
        ),
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.isEmailVerified) {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.FORBIDDEN,
          false,
          'Email is not verified',
          null,
          {
            reason: 'EMAIL_NOT_VERIFIED',
            hint: 'Use /auth/resend-verification to receive a new verification email.',
          },
        ),
        HttpStatus.FORBIDDEN,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.hashedPassword,
    );
    if (!isPasswordValid) {
      await this.recordFailedLogin(email);
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid email or password',
          null,
          { reason: 'INVALID_PASSWORD' },
        ),
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.clearLoginAttempts(email);

    const accessToken = this.jwtTokenService.generateAccessToken(user);
    const refreshToken = this.jwtTokenService.generateRefreshToken(user);

    return new ResponseCommon(HttpStatus.OK, true, 'Login successful', {
      user: this.toUserResponse(user),
      accessToken,
      refreshToken,
    });
  }

  async logout(authorization: string | undefined, refreshToken: string) {
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.split('Bearer ')[1]
      : undefined;

    const normalizedRefreshToken = refreshToken.startsWith('Bearer ')
      ? refreshToken.split('Bearer ')[1]
      : refreshToken;

    if (!normalizedRefreshToken) {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.BAD_REQUEST,
          false,
          'Refresh token is required for logout',
          null,
          {
            reason: 'MISSING_REFRESH_TOKEN',
            hint: 'Send body.refreshToken',
          },
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    const redis = this.redisService.getClient();

    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as { exp?: number } | null;
        if (decoded?.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await redis.setex(`blacklist:access:${accessToken}`, ttl, 'blacklisted');
          }
        }
      } catch (err) {
        this.logger.error('Error blacklisting access token', err);
      }
    }

    try {
      const decoded = jwt.decode(normalizedRefreshToken) as { exp?: number } | null;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redis.setex(
            `blacklist:refresh:${normalizedRefreshToken}`,
            ttl,
            'blacklisted',
          );
        }
      }
    } catch (err) {
      this.logger.error('Error blacklisting refresh token', err);
    }

    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'Logout successful. Tokens have been revoked.',
      null,
    );
  }

  async refresh(dto: RefreshDto) {
    const redis = this.redisService.getClient();
    const blacklisted = await redis.get(`blacklist:refresh:${dto.refreshToken}`);
    if (blacklisted) {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid or expired refresh token',
          null,
          { reason: 'REFRESH_TOKEN_REVOKED' },
        ),
        HttpStatus.UNAUTHORIZED,
      );
    }

    let decoded;
    try {
      decoded = this.jwtTokenService.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.UNAUTHORIZED,
          false,
          'Invalid or expired refresh token',
          null,
          { reason: 'REFRESH_TOKEN_INVALID_OR_EXPIRED' },
        ),
        HttpStatus.UNAUTHORIZED,
      );
    }

    const newAccessToken = this.jwtTokenService.generateAccessToken(decoded);
    const newRefreshToken = this.jwtTokenService.generateRefreshToken(decoded);

    // Rotate refresh token: blacklist token cũ để ngăn replay.
    const oldRefreshDecoded = jwt.decode(dto.refreshToken) as { exp?: number } | null;
    if (oldRefreshDecoded?.exp) {
      const ttl = oldRefreshDecoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.setex(`blacklist:refresh:${dto.refreshToken}`, ttl, 'blacklisted');
      }
    }

    return new ResponseCommon(HttpStatus.OK, true, 'Token refreshed', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    let debugResetUrl: string | undefined;
    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      await this.redisService
        .getClient()
        .setex(
          `auth:password-reset:${tokenHash}`,
          this.passwordResetTokenTtlSeconds,
          user.id,
        );

      const resetBaseUrl = this.getPasswordResetBaseUrl();
      const separator = resetBaseUrl.includes('?') ? '&' : '?';
      const resetUrl = `${resetBaseUrl}${separator}token=${rawToken}`;
      await this.notificationService.notifyResetPassword({
        to: email,
        resetUrl,
      });

      if (process.env.NODE_ENV !== 'production') {
        debugResetUrl = resetUrl;
      }
    }

    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'If this email exists, password reset instructions have been sent.',
      debugResetUrl ? { resetUrl: debugResetUrl } : null,
    );
  }

  getForgotPasswordRedirectUrl(token: string) {
    if (!token?.trim()) {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.BAD_REQUEST,
          false,
          'Reset token is required',
          null,
          { reason: 'RESET_TOKEN_REQUIRED' },
        ),
        HttpStatus.BAD_REQUEST,
      );
    }
    const resetBaseUrl = this.getPasswordResetBaseUrl();
    const separator = resetBaseUrl.includes('?') ? '&' : '?';
    return `${resetBaseUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const redis = this.redisService.getClient();
    const userId = await redis.get(`auth:email-verify:${tokenHash}`);
    if (!userId) {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.BAD_REQUEST,
          false,
          'Invalid or expired verification token',
          null,
          { reason: 'EMAIL_VERIFY_TOKEN_INVALID_OR_EXPIRED' },
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      await redis.del(`auth:email-verify:${tokenHash}`);
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.BAD_REQUEST,
          false,
          'Invalid or expired verification token',
          null,
          { reason: 'EMAIL_VERIFY_TOKEN_INVALID_OR_EXPIRED' },
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    await this.userRepository.save(user);
    await redis.del(`auth:email-verify:${tokenHash}`);

    return new ResponseCommon(HttpStatus.OK, true, 'Email verified successfully', null);
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (user && !user.isEmailVerified) {
      await this.issueEmailVerification(user);
    }

    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'If this email exists and is not verified, verification instructions have been sent.',
      null,
    );
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const redis = this.redisService.getClient();
    const userId = await redis.get(`auth:password-reset:${tokenHash}`);
    if (!userId) {
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.BAD_REQUEST,
          false,
          'Invalid or expired reset token',
          null,
          { reason: 'RESET_TOKEN_INVALID_OR_EXPIRED' },
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      await redis.del(`auth:password-reset:${tokenHash}`);
      throw new HttpException(
        new ResponseCommon(
          HttpStatus.BAD_REQUEST,
          false,
          'Invalid or expired reset token',
          null,
          { reason: 'RESET_TOKEN_INVALID_OR_EXPIRED' },
        ),
        HttpStatus.BAD_REQUEST,
      );
    }

    user.hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    await redis.del(`auth:password-reset:${tokenHash}`);

    return new ResponseCommon(
      HttpStatus.OK,
      true,
      'Password reset successfully',
      null,
    );
  }
}

