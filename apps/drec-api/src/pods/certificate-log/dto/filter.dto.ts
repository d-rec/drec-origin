import { IsOptional } from 'class-validator';
import { ApiPropertyOptional, ApiProperty} from '@nestjs/swagger';


import { IsNotEmpty, IsString } from 'class-validator';


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

export class AmountFormattingDTO {

  @ApiProperty({ type: String })
  @IsString()
  amount: string;

  
}
