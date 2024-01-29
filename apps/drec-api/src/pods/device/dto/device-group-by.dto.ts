import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceOrderBy } from '../../../utils/enums';

export class DeviceGroupByDTO {
  @ApiProperty({
    description: 'List of query options to group by',
    isArray: true,
    enum: DeviceOrderBy,
  })
  @IsEnum(DeviceOrderBy, { each: true })
  orderBy: DeviceOrderBy[];
}
