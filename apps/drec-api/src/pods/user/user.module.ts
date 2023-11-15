import { Module,forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { EmailConfirmationModule } from '../email-confirmation/email-confirmation.module';
import {OrganizationModule} from '../organization/organization.module'
import {UserRole} from './user_role.entity'
@Module({
  imports: [TypeOrmModule.forFeature([User,UserRole]), EmailConfirmationModule,
  forwardRef(() => OrganizationModule)],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
