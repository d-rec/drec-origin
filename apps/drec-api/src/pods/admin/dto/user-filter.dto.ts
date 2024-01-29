import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../utils/enums';

export class UserFilterDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Organization name' })
  organizationName: string;

  @IsOptional()
  @ApiPropertyOptional({
    type: UserStatus,
    description: 'User Status',
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
