import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../../dto/user-context.dto';

export const ExtractUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto => {
    const request = context.switchToHttp().getRequest();

    const userId = request.user.id;
    const ip = request.ip
    const device = request.headers['user-agent']

    if (!userId) {
      throw new Error('there is no user in the request object!');
    }

    return {
      userId,
      ip,
      device
    };
  },
);

export const ExtractUserFromRequestOrNotUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return user;
  },
);

export const ExtractRefreshFromCookie = createParamDecorator(
  (data: unknown, context: ExecutionContext): string | null => {
    const request = context.switchToHttp().getRequest();
    const payload = request.payload

    return payload
  },
);
