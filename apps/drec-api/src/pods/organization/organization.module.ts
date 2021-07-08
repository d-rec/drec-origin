import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';

import { OrganizationController } from './organization.controller';
import { Organization } from './organization.entity';
import { OrganizationService } from './organization.service';
import { BlockchainPropertiesModule } from '@energyweb/issuer-api';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    UserModule,
    BlockchainPropertiesModule,
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
