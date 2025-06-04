import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { EvidentSettings } from './evident.entity';
import { EvidentController } from './evident.controller';
import { EvidentService } from './evident.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, EvidentSettings])],
  controllers: [EvidentController],
  providers: [EvidentService],
  exports: [EvidentService],
})
export class EvidentModule {}
