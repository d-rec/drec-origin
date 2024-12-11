import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SDGBenefitController } from './sdgbenefit.controller';
import { SDGBenefitService } from './sdgbenefit.service';
import { SDGBenefit } from './sdgbenefit.entity';
@Module({
  imports: [TypeOrmModule.forFeature([SDGBenefit])],
  controllers: [SDGBenefitController],
  providers: [SDGBenefitService],
})
export class SDGbenefitModule {}
