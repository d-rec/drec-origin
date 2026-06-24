import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ReadsModule } from '../reads/reads.module';
import { EnodeAuthService } from './enode-auth.service';
import { EnodeClient } from './enode.client';
import { EnodeConfig } from './enode.config';
import { EnodeCron } from './enode.cron';
import { EnodeSyncService } from './enode-sync.service';

/**
 * Enode integration: pulls live solar-inverter telemetry and ingests it as
 * meter reads via the existing ReadsService pipeline.
 *
 * Inert unless `ENODE_CLIENT_ID` / `ENODE_CLIENT_SECRET` are configured.
 * See ./README.md for env vars and the productionisation path.
 */
@Module({
  imports: [HttpModule, ReadsModule],
  providers: [
    EnodeConfig,
    EnodeAuthService,
    EnodeClient,
    EnodeSyncService,
    EnodeCron,
  ],
  exports: [EnodeSyncService, EnodeClient],
})
export class EnodeModule {}
