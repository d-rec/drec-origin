import { IsOptional, IsArray, IsString, IsNumber } from 'class-validator';

export class deviceFilterDTO {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deviceTypeCodes: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  offTakers: string[];

  @IsOptional()
  @IsString()
  gridInterconnection: string;

  @IsOptional()
  @IsNumber()
  aggregatedCapacity: number;

  @IsOptional()
  @IsNumber()
  yieldValue: number;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  fuelCode: string;
}
