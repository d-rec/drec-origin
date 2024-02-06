/* */
import {
  IsDate,
  IsOptional,
  IsPositive

} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export enum accumulationType {
  monthly = 'Monthly',
  yearly = 'Yearly',
 
}

export enum readType{
  accumulated='accumulated',
  meterReads='meterReads'
}

export class filterNoOffLimit {
  
  @ApiProperty({enum:readType, description:'Specify the type of reads'})
  readType:readType;

  @IsOptional()
  @ApiProperty({description:'Example : 2020-01-01T00:00:00Z',required:false})
  start: Date;

  @ApiProperty({description:'Example : 2020-01-01T00:00:00Z',required:false})
  end: Date;

  @ApiProperty({ enum: accumulationType, enumName: 'accumulationType',required:false })
  accumulationType:accumulationType;

  limit: number;

   offset: number;

   @IsOptional()
   @ApiProperty({type : Number, required : false, description : "Mention when it's requested from Apiuser"})
   organizationId?:number;
}
/* */