import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../../shared/redis/redis.service';
import type { JwtUserPayload } from '../services/jwt-token.service';

/**
 * Passport JWT — verify chữ ký + kiểm tra blacklist Redis (giống Express authMiddleware).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtUserPayload,
  ): Promise<JwtUserPayload> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token) {
      const blacklisted = await this.redisService
        .getClient()
        .get(`blacklist:access:${token}`);
      if (blacklisted) {
        throw new UnauthorizedException({
          success: false,
          message: 'Token has been revoked. Please login again.',
        });
      }
    }
    return payload;
  }
}
