import { Module,forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { EmailConfirmationModule } from '../email-confirmation/email-confirmation.module';
import {OrganizationModule} from '../organization/organization.module'
import { OauthClientCredentialsService } from './oauth_client.service';
import { OauthClientCredentials } from './oauth_client_credentials.entity';
import { ApiUserEntity } from './api-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User,OauthClientCredentials,ApiUserEntity]), EmailConfirmationModule,
  forwardRef(() => OrganizationModule)],
  providers: [UserService,OauthClientCredentialsService],
  controllers: [UserController],
  exports: [UserService,OauthClientCredentialsService],
})
export class UserModule {}
