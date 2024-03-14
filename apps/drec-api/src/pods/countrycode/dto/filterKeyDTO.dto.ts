import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterKeyDTO {
  @IsOptional()
  @ApiPropertyOptional({ type: String, description: 'country name' })
  searchKeyWord: string;
}
