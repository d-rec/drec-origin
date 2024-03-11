import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationFilterDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'Organization name' })
  organizationName: string;
}
