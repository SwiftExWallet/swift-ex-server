import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getClientIpFromRequest } from './ip.util';

export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return getClientIpFromRequest(req);
  },
);
