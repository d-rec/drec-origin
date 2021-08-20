import { ApiProperty } from '@nestjs/swagger';
import { plainToClass, Expose } from 'class-transformer';

import { OrganizationDTO } from '../../pods/organization/dto';
import { UserDTO } from '../../pods/user/dto/user.dto';

@Expose()
export class OrganizationUserDTO extends UserDTO {
  @ApiProperty({ type: OrganizationDTO })
  organization: OrganizationDTO;

  public static sanitize(
    organizationUser: OrganizationUserDTO,
  ): OrganizationUserDTO {
    return {
      ...plainToClass(OrganizationUserDTO, organizationUser, {
        excludeExtraneousValues: false,
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
