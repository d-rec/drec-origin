import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import {
    IsEnum,
    IsBoolean,
    IsString,
    IsNotEmpty,
    IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ISdgBenefit } from '../../../models';

@Entity()
export class SdgBenefitDTO implements Omit<ISdgBenefit, 'id'>{
    
    @ApiProperty()
    @IsString()
    SdgbenefitName: string;

    @ApiProperty()
    @IsString()
    sdgbenefitdescription: string;


    @ApiProperty()

    @IsNumber()
    sdgbenefitBitposition: number;
}