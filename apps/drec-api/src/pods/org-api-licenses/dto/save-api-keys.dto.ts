import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  anthropicApiKey?: string;

  // Explicit destructive flags. An empty/null value alone NEVER clears a
  // previously-set key — that turned out to be too easy to trigger by
  // accident (a registrant opens the page, the form renders blank for any
  // reason, they click Save, and three keys go to NULL with no record of
  // who or why). To clear, the client must send the matching clear* flag.
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clearRoboflowApiKey?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clearRoboflowWorkflowUrl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clearDeeplApiKey?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  clearAnthropicApiKey?: boolean;
}
