import {
    IsString,
    IsNumber,
    IsEnum,
    IsArray,
    IsNotEmpty,
    IsBoolean,
    IsOptional,
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

  
  export class JobFailedRowsDTO {
    @ApiProperty()
    @IsNumber()
    id: number;

    @ApiProperty()
    @IsNumber()
    jobId: number;
  
    @ApiProperty()
    errorDetails: any;
    
  }
  
  