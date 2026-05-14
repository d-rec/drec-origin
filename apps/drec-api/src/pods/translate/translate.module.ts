import { Module } from '@nestjs/common';
import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';
import { OrgApiLicensesModule } from '../org-api-licenses/org-api-licenses.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [OrgApiLicensesModule, AiModule],
  controllers: [TranslateController],
  providers: [TranslateService],
})
export class TranslateModule {}
