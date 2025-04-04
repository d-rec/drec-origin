import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationType } from '../../../utils/enums';
export class OrganizationFilterDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Organization name' })
  organizationName: string;

  @IsOptional()
  @IsString()
  organizationType?: OrganizationType;
}
