/* */
  import {
    IsDate,
    IsOptional,
    IsPositive
  
  } from 'class-validator';
  
  import { ApiProperty } from '@nestjs/swagger';
  
  export enum accumulatedType {
    daily = 'Daily',
    monthly = 'Monthly',
    yearly = 'Yearly',
   
  }
  export class filterNoOffLimit {
    
    @IsOptional()
    @ApiProperty({default: '2020-01-01T00:00:00Z' ,description:'Example : 2020-01-01T00:00:00Z'})
    start: Date;
  
    @ApiProperty({default:'2020-01-01T00:00:00Z' ,description:'Example : 2020-01-01T00:00:00Z'})
    end: Date;
  
    @ApiProperty({ enum: accumulatedType, enumName: 'accumulatedType',required:false })
    accumulated:accumulatedType;

    limit: number;
  
     offset: number;
  }
  /* */