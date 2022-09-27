import { Module } from '@nestjs/common';
import { TestapiService } from './testapi.service';
import { TestapiController } from './testapi.controller';

@Module({
  controllers: [TestapiController],
  providers: [TestapiService]
})
export class TestapiModule {}
