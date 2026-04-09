import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { User } from '../../users/entities/user.entity';

export type JwtUserPayload = {
  id: string;
  username: string;
  email: string;
  role: string;
};

/** Payload tối thiểu để ký JWT (User entity hoặc payload sau khi verify refresh). */
export type TokenSubject = Pick<
  User,
  'id' | 'username' | 'email' | 'role'
>;

@Injectable()
export class JwtTokenService {
  constructor(private readonly configService: ConfigService) {}

  generateAccessToken(user: TokenSubject | JwtUserPayload): string {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: '1h' },
    );
  }

  generateRefreshToken(user: TokenSubject): string {
    const secret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: '7d' },
    );
  }

  verifyAccessToken(token: string): JwtUserPayload {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return jwt.verify(token, secret) as JwtUserPayload;
  }

  verifyRefreshToken(token: string): JwtUserPayload {
    const secret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    return jwt.verify(token, secret) as JwtUserPayload;
  }
}
