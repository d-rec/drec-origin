import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceOrderBy, OrderDirection } from '../../../utils/enums';

export class OrderByDTO {
  @ApiPropertyOptional({
    description: 'List of query options to order by',
    isArray: true,
    enum: DeviceOrderBy,
  })
  @IsEnum(DeviceOrderBy, { each: true })
  @IsOptional()
  orderBy: DeviceOrderBy[];

  @ApiPropertyOptional({
    type: OrderDirection,
    description: 'Order direction',
    enum: OrderDirection,
    default: OrderDirection.Desc,
  })
  @IsEnum(OrderDirection)
  @IsOptional()
  orderDirection: OrderDirection;
}
