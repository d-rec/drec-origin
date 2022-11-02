import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../../utils/enums';

export class FilterDTO {


  @IsOptional()
  @ApiPropertyOptional({ description: 'Start date  filter' })
  start_date: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'End date   filter' })
  end_date: string;

  
}

export class GroupIDBasedFilteringDTO {

  @IsOptional()
  @ApiPropertyOptional({ description: 'Group Id' })
  groupId: string;

  
}
