import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDTO } from '../pods/user/dto/user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(email: string, password: string): Promise<UserDTO> {
    this.logger.verbose('With in validate');
    const user = await this.authService.validateUser(email, password);
    return user;
  }
}
