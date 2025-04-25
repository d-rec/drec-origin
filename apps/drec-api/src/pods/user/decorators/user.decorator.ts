import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUser, LoggedInUser } from '../../../models';

export const UserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IUser;

    return new LoggedInUser(user);
  },
);
