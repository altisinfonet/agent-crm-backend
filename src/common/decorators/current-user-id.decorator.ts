import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, ctx: ExecutionContext): bigint => {
    const request = ctx.switchToHttp().getRequest();

    return BigInt(request.user.sub);
  },
);
