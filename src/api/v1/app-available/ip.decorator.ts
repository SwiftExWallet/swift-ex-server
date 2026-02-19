import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
           req.ip || 
           req.connection.remoteAddress || 
           'Unknown';
  },
);
