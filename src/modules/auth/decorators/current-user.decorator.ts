import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtUserPayload } from '../services/jwt-token.service';

/**
 * Lấy user từ JWT payload sau JwtStrategy (req.user).
 * @example @CurrentUser() user / @CurrentUser('id') id
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
