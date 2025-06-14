import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { EvidentSettings } from './evident-settings.entity';
import { EvidentSettingsController } from './evident-settings.controller';
import { EvidentSettingsService } from './evident-settings.service';
import { EvidentService } from './evident.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, EvidentSettings])],
  controllers: [EvidentSettingsController],
  providers: [EvidentSettingsService, EvidentService],
  exports: [EvidentSettingsService, EvidentService],
})
export class EvidentModule {}
