import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganizationController } from './organization.controller';
import { Organization } from './organization.entity';
import { OrganizationService } from './organization.service';
import { BlockchainPropertiesModule } from '@energyweb/issuer-api';
import { UserModule } from '../user/user.module';
import { MailModule } from '../../mail';
import { FileModule } from '../file';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
   // UserModule,
    forwardRef(() => UserModule),
    BlockchainPropertiesModule,
    MailModule,
    forwardRef(() => UserModule),
    FileModule,
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
