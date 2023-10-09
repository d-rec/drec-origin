import {
    IsString,
    IsEnum,
    IsBoolean,
    IsArray,
    IsNumber,
    IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
    YieldStatus,

} from '../../../utils/enums';

import { IYieldConfig } from '../../../models';
export class UpdateYieldValueDTO
    implements Omit<IYieldConfig, 'id' | 'status'>
{

    @ApiProperty({ type: String })
    @IsString()
    countryName: string;

    @ApiProperty({ type: String })
    @IsString()
    countryCode: string;
    @ApiProperty()
    @IsNumber()

    yieldValue: number;

    @ApiProperty({ enum: YieldStatus, enumName: 'yieldstatus' })
    @IsEnum(YieldStatus)
    status: YieldStatus;




}
