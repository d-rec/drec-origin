import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  chatEntry: string;

  @ApiPropertyOptional()
  nextEntryUuid: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class ConversationDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  participant1: string;

  @ApiProperty()
  participant2: string;

  @ApiProperty()
  headUuid: string;

  @ApiPropertyOptional()
  lastEntryUuid: string | null;

  @ApiPropertyOptional()
  deviceProjectName: string | null;
}
