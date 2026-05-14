import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiAuditService } from './ai-audit.service';
import { AiAuditLog } from './ai-audit-log.entity';
import { AiResponseCache } from './ai-response-cache.entity';
import { OrgApiLicensesModule } from '../org-api-licenses/org-api-licenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiAuditLog, AiResponseCache]),
    OrgApiLicensesModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiAuditService],
  exports: [AiService, AiAuditService],
})
export class AiModule {}
