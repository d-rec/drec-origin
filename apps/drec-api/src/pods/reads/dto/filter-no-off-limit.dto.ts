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
  export class filterNoOffLimit {
    
    @IsOptional()
    @ApiProperty({description:'Example : 2020-01-01T00:00:00Z',required:false})
    start: Date;
  
    @ApiProperty({description:'Example : 2020-01-01T00:00:00Z',required:false})
    end: Date;
  
    @ApiProperty({ enum: accumulationType, enumName: 'accumulationType',required:false })
    accumulationType:accumulationType;

    limit: number;

     offset: number;
  }
  /* */