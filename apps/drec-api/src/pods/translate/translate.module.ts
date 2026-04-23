import { Module } from '@nestjs/common';
import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';
import { OrgApiLicensesModule } from '../org-api-licenses/org-api-licenses.module';

@Module({
  imports: [OrgApiLicensesModule],
  controllers: [TranslateController],
  providers: [TranslateService],
})
export class TranslateModule {}
