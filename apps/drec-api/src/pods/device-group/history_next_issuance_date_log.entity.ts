// import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
// import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
// import {
//   IsString,
//   IsNotEmpty,
//   IsEnum,
//   IsBoolean,
//   IsNumber,
//   IsOptional,
//   IsDate
// } from 'class-validator';
// import {IHistoryDeviceGroupNextIssueCertificate } from '../../models';
// import {
//   CapacityRange,
//   CommissioningDateRange,
//   Installation,
//   OffTaker,
//   Sector,
//   StandardCompliance,
// } from '../../utils/enums';
// import { Device } from '../device';

// @Entity('history_next_issuance_date_log')

// // export class HistoryDeviceGroupNextIssueCertificate extends ExtendedBaseEntity {

// //   @PrimaryGeneratedColumn()
// //   id: number;

// //   @Column()
// //   groupId: number;

// //   @Column()
// //   @IsDate()
// //   reservationStartDate: Date;

// //   @Column()
// //   @IsDate()
// //   reservationEndDate: Date;

// //   @Column()
// //   @IsString()
// //   device_externalid: string;

// //   @Column()
// //   @IsDate()
// //   device_createdAt: Date;
// // }

// export class reservationEndDate

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

@Entity('history_next_issueance_log')
export class HistoryDeviceGroupNextIssueCertificate extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column()
  @IsDate()
  reservationStartDate: Date;

  @Column()
  @IsDate()
  reservationEndDate: Date;

  @Column()
  @IsString()
  device_externalid: string;

  @Column()
  @IsDate()
  device_createdAt: Date;

  @Column()
  @IsString()
  status: string;
}
