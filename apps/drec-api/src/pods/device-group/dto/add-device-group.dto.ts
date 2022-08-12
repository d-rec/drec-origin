import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class AddGroupDTO {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [Number] })
  @IsInt({ each: true })
  @Min(1, { each: true })
  deviceIds: number[];

  @ApiProperty({ type: Number })
  targetCapacityInMegaWattHour:number;

  
  @ApiProperty({ type: Date })
  startDate:Date;

  
  @ApiProperty({ type: Date })
  endDate:Date;
}
