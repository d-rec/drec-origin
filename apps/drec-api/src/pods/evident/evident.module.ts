import { Module } from '@nestjs/common';
import { EvidentService } from './evident.controller.service';
import { EvidentController } from './evident.controller';

@Module({
  controllers: [EvidentController],
  providers: [EvidentService],
  exports: [EvidentService],
})
export class EvidentModule {}