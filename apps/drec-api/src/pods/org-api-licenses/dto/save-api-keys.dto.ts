import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SaveApiKeysDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roboflowApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roboflowWorkflowUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deeplApiKey?: string;
}
