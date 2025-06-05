import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { EvidentSettings } from './evidentSettings.entity';
import { EvidentSettingsController } from './evidentSettings.controller';
import { EvidentSettingsService } from './evidentSettings.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, EvidentSettings])],
  controllers: [EvidentSettingsController],
  providers: [EvidentSettingsService],
  exports: [EvidentSettingsService],
})
export class EvidentModule {}
