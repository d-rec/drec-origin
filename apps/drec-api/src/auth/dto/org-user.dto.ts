import { ApiProperty, OmitType } from '@nestjs/swagger';
import { plainToClass, Expose } from 'class-transformer';

import { OrganizationDTO } from '../../pods/organization/organization.dto';
import { UserDTO } from '../../pods/user/dto/user.dto';

@Expose()
export class OrganizationUserDTO extends OmitType(UserDTO, [
  'organizationId',
] as const) {
  @ApiProperty({ type: OrganizationDTO })
  organization: OrganizationDTO;

  public static sanitize(
    organizationUser: OrganizationUserDTO,
  ): OrganizationUserDTO {
    return {
      ...plainToClass(OrganizationUserDTO, organizationUser, {
        excludeExtraneousValues: true,
      }),
      organization: plainToClass(
        OrganizationDTO,
        organizationUser.organization,
        {
          excludeExtraneousValues: true,
        },
      ),
    };
  }
}
