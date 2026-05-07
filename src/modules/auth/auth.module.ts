import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtTokenService } from './services/jwt-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationModule } from '../notification/notification.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User]),
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokenService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    PassportModule,
    JwtTokenService,
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    RolesGuard,
  ],
})
export class AuthModule {}
