import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  chatEntry: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  previousEntryUuid?: string;
}
