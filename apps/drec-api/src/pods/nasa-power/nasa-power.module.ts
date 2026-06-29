import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NasaPowerService } from './nasa-power.service';
import { NasaPowerMonthlyCache } from './nasa-power-monthly-cache.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([NasaPowerMonthlyCache])],
  providers: [NasaPowerService],
  exports: [NasaPowerService],
})
export class NasaPowerModule {}
