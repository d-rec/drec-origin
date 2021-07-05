import { ConfigService } from '@nestjs/config';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class IsDrecOrUserGuard extends AuthGuard('jwt') implements CanActivate {
  public constructor(private readonly configService: ConfigService) {
    super({});
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    if (
      request.headers['api-key'] ===
      this.configService.get<string>('DREC_API_KEY')
    ) {
      return true;
    }

    return super.canActivate(context) as boolean;
  }
}
