import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContext } from '@secure-tms/auth';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthContext['user'] => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
