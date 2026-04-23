import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secret?: string;
}
