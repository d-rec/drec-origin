import { ExtendedBaseEntity } from '../../lib/entity/extended-base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsString } from 'class-validator';

@Entity('irec_devices_information')
export class IRECDevicesInformationEntity extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  IREC_id: string;

  @Column()
  @IsString()
  event: string;

  @Column('json')
  request: any;

  @Column('json')
  responses: any;
}
