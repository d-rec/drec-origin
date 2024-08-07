import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// {"deviceId":"10","energyValue":"2463000","fromTime":"2022-07-31T18:30:01.000Z","toTime":"2022-08-31T18:29:59.000Z",
// "toAddress":"0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437",
// "userId":"0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437",

// "metadata":
// {"version":"v1.0","buyerReservationId":"e02f1ffb-bef3-45fd-b6b2-0d5724fa5205","isStandardIssuanceRequested":"I-REC","type":"REC","deviceIds":[14],"groupId":"10"}}

export class ReIssueCertificateDTO {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiProperty()
  @IsString()
  energyValue: string;

  @ApiProperty()
  @IsString()
  fromTime: Date;

  @ApiProperty()
  @IsString()
  toTime: Date;

  @ApiProperty()
  @IsString()
  toAddress: string;

  @ApiProperty()
  metadata: any;

  @ApiProperty()
  userId: string;
}
