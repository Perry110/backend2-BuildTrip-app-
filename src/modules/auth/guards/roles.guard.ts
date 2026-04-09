import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ResponseCommon } from '../../../common/dto/response.dto';
import { ForbiddenException } from '@nestjs/common';

/**
 * Chỉ chặn khi có @Roles(...); không có metadata → cho qua.
 * Cần JwtAuthGuard chạy trước để có req.user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user?.role) {
      throw new ForbiddenException(
        new ResponseCommon(
          HttpStatus.FORBIDDEN,
          false,
          'NOT ROLES',
          null,
        ),
      );
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        new ResponseCommon(
          HttpStatus.FORBIDDEN,
          false,
          'Insufficient permissions',
          null,
          { reason: 'ROLE_NOT_ALLOWED', requiredRoles, role: user.role },
        ),
      );
    }
    return true;
  }
}
