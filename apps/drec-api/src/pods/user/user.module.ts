import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { EmailConfirmationModule } from '../email-confirmation/email-confirmation.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserRole } from './user_role.entity';
import { OauthClientCredentialsService } from './oauth_client.service';
import { OauthClientCredentials } from './oauth_client_credentials.entity';
import { RegistrantEntity } from './registrant.entity';
import { UserLoginSessionEntity } from './user_login_session.entity';
import { OtpModule } from '../otp/otp.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserRole,
      OauthClientCredentials,
      RegistrantEntity,
      UserLoginSessionEntity,
    ]),
    forwardRef(() => EmailConfirmationModule),
    forwardRef(() => OrganizationModule),
    OtpModule,
    MailModule,
  ],
  providers: [UserService, OauthClientCredentialsService],
  controllers: [UserController],
  exports: [UserService, OauthClientCredentialsService],
})
export class UserModule {}
