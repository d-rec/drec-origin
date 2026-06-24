import { Injectable, Logger } from '@nestjs/common';
import { NewIntermediateMeterReadDTO } from '../reads/dto/intermediate_meter_read.dto';
import { ReadsService } from '../reads/reads.service';
import { NewReadDTO } from '../../models/AggregateMetervalue';
import { Unit } from '../../types/reads';
import { ReadType } from '../../utils/enums';
import { EnodeClient } from './enode.client';
import { EnodeConfig, EnodeDeviceMapping } from './enode.config';

/**
 * Pulls live inverter telemetry from Enode and turns it into D-REC meter reads.
 *
 * Strategy: diff `productionState.totalLifetimeProduction` (a cumulative kWh
 * counter that updates live) between polls. Each positive delta becomes one
 * Delta read fed through the normal `ReadsService.storeRead` pipeline, so the
 * production-ceiling check and downstream issuance apply unchanged. The Enode
 * `/statistics` series is deliberately avoided (throttled / null on fresh).
 *
 * State note: the per-inverter baseline lives in memory and resets on restart,
 * so the first tick after a restart re-seeds the baseline and emits no read
 * (it cannot fabricate the energy produced while the process was down). This
 * is the documented cost of skipping a migration in this first cut; persist
 * the last counter on an `EnodeSettings`/`Device` column to make it durable.
 */
@Injectable()
export class EnodeSyncService {
  private readonly logger = new Logger(EnodeSyncService.name);

  /** inverterId -> last observed lifetime counter (kWh) and its timestamp. */
  private readonly lastCounter = new Map<string, { kwh: number; at: Date }>();

  constructor(
    private readonly config: EnodeConfig,
    private readonly client: EnodeClient,
    private readonly readsService: ReadsService,
  ) {}

  async sync(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.debug(
        'Enode integration disabled (no client credentials); skipping',
      );
      return;
    }

    const mappings = this.config.deviceMappings;
    if (mappings.length === 0) {
      this.logger.debug('No ENODE_DEVICE_MAP entries; nothing to poll');
      return;
    }

    for (const mapping of mappings) {
      try {
        await this.syncOne(mapping);
      } catch (e) {
        this.logger.error(
          `Enode sync failed for inverter ${mapping.inverterId} -> device ${
            mapping.deviceExternalId
          }: ${(e as Error)?.message ?? e}`,
        );
      }
    }
  }

  private async syncOne(mapping: EnodeDeviceMapping): Promise<void> {
    const inverter = await this.client.getInverter(mapping.inverterId);
    const counter = inverter.productionState?.totalLifetimeProduction;

    if (counter == null) {
      this.logger.warn(
        `Inverter ${mapping.inverterId} has no totalLifetimeProduction; skipping`,
      );
      return;
    }

    const at = inverter.productionState.lastUpdated
      ? new Date(inverter.productionState.lastUpdated)
      : new Date();

    const prev = this.lastCounter.get(mapping.inverterId);
    this.lastCounter.set(mapping.inverterId, { kwh: counter, at });

    if (!prev) {
      this.logger.log(
        `Seeded baseline for inverter ${mapping.inverterId} at ${counter} kWh; ` +
          'first read will be emitted on the next tick',
      );
      return;
    }

    const deltaKwh = counter - prev.kwh;
    if (deltaKwh <= 0) {
      this.logger.debug(
        `No production delta for inverter ${mapping.inverterId} (Δ=${deltaKwh}); skipping`,
      );
      return;
    }

    const read: NewReadDTO = {
      starttimestamp: prev.at,
      endtimestamp: at,
      value: deltaKwh,
    };

    const dto: NewIntermediateMeterReadDTO = {
      type: ReadType.Delta,
      unit: Unit.kWh,
      timezone: inverter.timezone ?? undefined,
      reads: [read],
    };

    await this.readsService.storeRead(mapping.deviceExternalId, dto);
    this.logger.log(
      `Stored ${deltaKwh} kWh (counter Δ) for device ${mapping.deviceExternalId} ` +
        `from inverter ${mapping.inverterId}`,
    );
  }
}
