import { IsNotEmpty, IsString,IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceGroupDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class EndResavationdateDTO {
  @ApiProperty()
  @IsDate()
  endresavationdate: Date;
}
