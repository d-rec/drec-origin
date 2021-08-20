import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';

import { UserService } from '../pods/user/user.service';
import { IJWTPayload } from './auth.service';
import { OrganizationService } from '../pods/organization';
import { OrganizationUserDTO } from './dto/org-user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'thisisnotsecret',
    });
  }

  async validate(payload: IJWTPayload): Promise<OrganizationUserDTO | null> {
    const user = await this.userService.findByEmail(payload.email);

    if (user) {
      const organization = await this.organizationService.findById(
        user.organizationId,
      );

      if (!organization) {
        throw new BadRequestException(
          `User ${payload.email} does not belong to any organization.`,
        );
      }

      return OrganizationUserDTO.sanitize({
        ...user,
        organization,
      });
    }

    return null;
  }
}
