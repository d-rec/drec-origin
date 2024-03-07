import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsDate,
} from 'class-validator';

@Entity('irec_error_log_information')
export class IrecErrorLogInformationEntity extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  event: string;

  @Column('json')
  request: any;

  @Column('json')
  error_log_responses: any;
}
