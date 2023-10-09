import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../../mail';

import { EmailConfirmation } from './email-confirmation.entity';
import { EmailConfirmationService } from './email-confirmation.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfirmation]), MailModule, forwardRef(() => UserModule)],
  providers: [EmailConfirmationService],
  controllers: [],
  exports: [EmailConfirmationService],
})
export class EmailConfirmationModule {}
