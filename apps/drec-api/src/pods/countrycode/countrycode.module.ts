import { Module } from '@nestjs/common';
import { CountrycodeController } from './countrycode.controller';
import { CountrycodeService } from './countrycode.service';
@Module({
  providers: [CountrycodeService],
  exports: [CountrycodeService],
  controllers: [CountrycodeController],
})
export class CountrycodeModule {}
