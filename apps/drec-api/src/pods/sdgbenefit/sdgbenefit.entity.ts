import { ExtendedBaseEntity } from '../utils/origin-backend-utils/extended-base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsNumber } from 'class-validator';
import { ISdgBenefit } from '../../models';

@Entity('sdgbenefit')
export class SDGBenefit extends ExtendedBaseEntity implements ISdgBenefit {
  constructor(sdgBenefit: Partial<SDGBenefit>) {
    super();
    Object.assign(this, sdgBenefit);
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
