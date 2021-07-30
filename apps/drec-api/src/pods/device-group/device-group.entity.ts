import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsNotEmpty } from 'class-validator';
import { IDevice } from '../device';

export interface IDeviceGroup {
  id: number;
  name: string;
  organizationId: string;
  devices?: IDevice[];
}

@Entity()
export class DeviceGroup extends ExtendedBaseEntity implements IDeviceGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  organizationId: string;

  devices?: IDevice[];
}
