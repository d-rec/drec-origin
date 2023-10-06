import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YieldConfigController } from './yieldconfig.controller';
import { YieldConfig } from './yieldconfig.entity';
import { YieldConfigService } from './yieldconfig.service';

@Module({
  imports: [TypeOrmModule.forFeature([YieldConfig])],
  providers: [YieldConfigService],
  exports: [YieldConfigService],
  controllers: [YieldConfigController],
})
export class YieldConfigModule {}
