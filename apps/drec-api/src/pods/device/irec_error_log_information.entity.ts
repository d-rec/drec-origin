import { ExtendedBaseEntity } from '../utils/origin-backend-utils/extended-base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsString } from 'class-validator';

@Entity('irec_error_log_information')
export class IRECErrorLogInformationEntity extends ExtendedBaseEntity {
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
