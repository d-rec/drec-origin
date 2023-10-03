import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../pods/user/user.service';
import { AuthService } from './auth.service';
import { UserDTO } from '../pods/user/dto/user.dto';
import { Role } from '../utils/enums/role.enum';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) {
    super();
  }

  async validate(email: string, password: string): Promise<UserDTO> {
    const user = await this.authService.validateUser(email, password);

    console.log("localuserstrategy", user)
    let adminuser = [];
    if (user.role != 'ApiUser') {
      //@ts-ignore
      adminuser = await this.userService.findOne({ api_user_id: user.api_user_id, role: Role.Admin });
      console.log("adminuser", adminuser);
    }

    if (!(user && adminuser)) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
