import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsDate
} from 'class-validator';


@Entity('irec_devices_information')
export class IrecDevicesInformationEntity extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  IREC_id: string;

  @Column()
  @IsString()
  event:string

  @Column('json')
  request: any;

  @Column('json')
  responses: any;
  

}