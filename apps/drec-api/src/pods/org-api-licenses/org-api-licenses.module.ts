import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgApiLicenses } from './org-api-licenses.entity';
import { AiAuditLog } from '../ai/ai-audit-log.entity';
import { OrgApiLicensesService } from './org-api-licenses.service';
import { ApiKeyResolverService } from './api-key-resolver.service';
import { OrgApiLicensesController } from './org-api-licenses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrgApiLicenses, AiAuditLog])],
  controllers: [OrgApiLicensesController],
  providers: [OrgApiLicensesService, ApiKeyResolverService],
  exports: [OrgApiLicensesService, ApiKeyResolverService],
})
export class OrgApiLicensesModule {}
