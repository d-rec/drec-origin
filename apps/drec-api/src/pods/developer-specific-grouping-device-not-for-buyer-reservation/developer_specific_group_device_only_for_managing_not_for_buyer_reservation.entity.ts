import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import {
  IsEnum,
  IsBoolean,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
} from 'class-validator';
import { DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationModel } from '../../models/DeveloperGrouingDeviceOnlyForManagerialPurposeNotBuyerReservation';

@Entity('developer_specific_managegroupdevices_notfor_buyerreservation')
export class DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity
  extends ExtendedBaseEntity
  implements
    DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationModel
{
  constructor(
    deviceGroup: Partial<DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationModel>,
  ) {
    super();
    Object.assign(this, deviceGroup);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  name: string;

  @Column('int', { array: true })
  deviceIds: Array<number>;

  @Column()
  @IsNumber()
  organizationId: number;

  @Column()
  @IsNumber()
  groupedByUserId: number;
}
