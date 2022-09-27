import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  IsOptional,
} from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { DeviceOrderBy } from '../../../utils/enums';
import { DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationModel } from '../../../models/DeveloperGrouingDeviceOnlyForManagerialPurposeNotBuyerReservation';

export class DeveloperDeviceGroupByDTO
  implements
    Partial<DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationModel>
{
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  groupedByUserId: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  organizationId: number;

  @ApiProperty()
  @IsNumber({}, { each: true })
  @IsArray()
  deviceIds: Array<number>;
}

export class CreateDeveloperDeviceGroupByDTO extends PickType(
  DeveloperDeviceGroupByDTO,
  ['name', 'deviceIds'] as const,
) {}
