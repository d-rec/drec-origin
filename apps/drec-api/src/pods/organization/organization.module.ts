import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganizationController } from './organization.controller';
import { Organization } from './organization.entity';
import { OrganizationService } from './organization.service';
import { BlockchainPropertiesModule } from '@energyweb/issuer-api';
import { UserModule } from '../user/user.module';
import { MailModule } from '../../mail';
import { FileModule } from '../file';
import { InvitationModule } from '../invitation/invitation.module';
import { DocumentUploadsModule } from '../document-uploads/document-uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),

    BlockchainPropertiesModule,
    MailModule,
    forwardRef(() => UserModule),
    FileModule,
    forwardRef(() => InvitationModule),
    DocumentUploadsModule,
  ],
  providers: [OrganizationService],
  controllers: [OrganizationController],
  exports: [OrganizationService, TypeOrmModule],
})
export class OrganizationModule {}
