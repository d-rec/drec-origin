import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../../mail';

import { EmailConfirmation } from './email-confirmation.entity';
import { EmailConfirmationService } from './email-confirmation.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfirmation]), MailModule],
  providers: [EmailConfirmationService],
  controllers: [],
  exports: [EmailConfirmationService],
})
export class EmailConfirmationModule {}
