import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SdgbenefitController } from './sdgbenefit.controller';
import { SdgbenefitService } from './sdgbenefit.service';
import { SDGBenefit } from './sdgbenefit.entity';
@Module({
  imports: [TypeOrmModule.forFeature([SDGBenefit])],
  controllers: [SdgbenefitController],
  providers: [SdgbenefitService],
})
export class SDGbenefitModule {}
