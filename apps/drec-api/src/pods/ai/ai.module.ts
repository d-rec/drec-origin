import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiAuditLog } from './ai-audit-log.entity';
import { OrgApiLicensesModule } from '../org-api-licenses/org-api-licenses.module';

@Module({
  imports: [TypeOrmModule.forFeature([AiAuditLog]), OrgApiLicensesModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
