import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { EvidentIntegration } from './evident.entity';
import { EvidentController } from './evident.controller';
import { EvidentService } from './evident.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, EvidentIntegration])],
  controllers: [EvidentController],
  providers: [EvidentService],
  exports: [EvidentService],
})
export class EvidentModule {}
