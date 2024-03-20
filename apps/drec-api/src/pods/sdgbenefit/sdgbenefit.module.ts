import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SdgbenefitController } from './sdgbenefit.controller';
import { SdgbenefitService } from './sdgbenefit.service';
import { SdgBenefit } from './sdgbenefit.entity';
@Module({
  imports: [TypeOrmModule.forFeature([SdgBenefit])],
  controllers: [SdgbenefitController],
  providers: [SdgbenefitService],
})
export class SdgbenefitModule {}
