import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsNumber } from 'class-validator';
import { ISdgBenefit } from '../../models';

@Entity('sdgbenefit')
export class SDGBenefit extends ExtendedBaseEntity implements ISdgBenefit {
  constructor(sdgbenefit: Partial<SDGBenefit>) {
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
