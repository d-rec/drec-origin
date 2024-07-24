import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO31661Alpha2,
  IsString,
  Min,
  IsOptional,
} from 'class-validator';
import { IPublicOrganization } from '../../../models';
import { OrganizationStatus } from '../../../utils/enums';
import { Organization } from '../organization.entity';

export class PublicOrganizationInfoDTO implements IPublicOrganization {
  @ApiProperty({ type: Number })
  @Expose()
  @IsInt()
  @Min(0)
  id: number;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  name: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // @IsOptional()
  // secretKey:string;

  @ApiProperty({ type: String })
  @IsString()
  @Expose()
  address: string;

  @ApiProperty({ type: String })
  @IsString()
  @Expose()
  zipCode: string;

  @ApiProperty({ type: String })
  @IsString()
  @Expose()
  city: string;

  @ApiProperty({ type: String })
  @IsISO31661Alpha2()
  @Expose()
  country: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  organizationType: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // @Expose()
  // tradeRegistryCompanyNumber: string;

  // @ApiProperty({ type: String })
  // @IsString()
  // @Expose()
  // vatNumber: string;

  @ApiProperty({ enum: OrganizationStatus, enumName: 'OrganizationStatus' })
  @IsEnum(OrganizationStatus)
  @Expose()
  status: OrganizationStatus;

  public static fromPlatformOrganization(
    platformOrganization: Organization,
  ): PublicOrganizationInfoDTO {
    return plainToClass(PublicOrganizationInfoDTO, platformOrganization, {
      excludeExtraneousValues: true,
    });
  }
}
