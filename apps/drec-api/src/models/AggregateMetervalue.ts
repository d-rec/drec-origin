import {
  Unit,
} from '@energyweb/energy-api-influxdb';
import {
    IsDate,
      IsOptional,
      IsPositive
      
    } from 'class-validator';
    import { ApiProperty } from '@nestjs/swagger';
  export class NewReadDTO {
      @ApiProperty({ type: Date })
      @IsOptional()
      starttimestamp: Date;
      
      @ApiProperty({ type: Date })
      @IsDate()
      endtimestamp:Date;
      
      @ApiProperty({ type: Number })
      @IsPositive()
      value: number;
  }
  
export interface IAggregateintermediate {
    id: number;
    // type: string;
    unit: Unit;
    value: number;
    deltaValue: number;
    datetime:string;  
    createdAt: Date;
    updatedAt: Date;
    deviceId?:string;


}
export interface Iintermediate {
    id: number;
    type: string;
    unit: Unit;
    
    createdAt: Date;
    deviceId?:string;
    reads?:NewReadDTO[]
   // status:YieldStatus;

}