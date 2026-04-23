import { Module } from '@nestjs/common';
import { SolarYieldService } from './solar-yield.service';

@Module({
  providers: [SolarYieldService],
  exports: [SolarYieldService],
})
export class SolarYieldModule {}
