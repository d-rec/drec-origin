import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  DeviceStatus,
  Installation,
  Integrator,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../utils/enums';
import {
  IsEnum,
  IsBoolean,
  IsString,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { ISdgBenefit } from '../../models';

@Entity('sdgbenefit')
export class SdgBenefit extends ExtendedBaseEntity implements ISdgBenefit {
  constructor(sdgbenefit: Partial<SdgBenefit>) {
    super();
    Object.assign(this, sdgbenefit);
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  SdgbenefitName: string;

  @Column()
  @IsString()
  sdgbenefitdescription: string;

  @Column()
  @IsNumber()
  sdgbenefitBitposition: number;
}
