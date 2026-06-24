import { Injectable, Logger } from '@nestjs/common';

/**
 * Maps an Enode inverter to the D-REC device whose meter reads it feeds.
 *
 * This first cut is config-driven on purpose: it avoids a schema migration
 * while the integration is exploratory. When productionising, replace this
 * with a per-organisation `EnodeSettings` entity plus a `Device.enodeInverterId`
 * column (see ./README.md) and resolve mappings from the DB instead of env.
 */
export interface EnodeDeviceMapping {
  /** Enode inverter id, i.e. `GET /inverters[].id`. */
  inverterId: string;
  /** D-REC `device.externalId` that readings are stored against. */
  deviceExternalId: string;
}

/**
 * Reads Enode integration config from the environment.
 *
 * The whole integration is a no-op unless both `ENODE_CLIENT_ID` and
 * `ENODE_CLIENT_SECRET` are set, so it cannot affect existing flows when
 * left unconfigured. Defaults point at the Enode sandbox.
 */
@Injectable()
export class EnodeConfig {
  private readonly logger = new Logger(EnodeConfig.name);

  readonly clientId = process.env.ENODE_CLIENT_ID ?? '';
  readonly clientSecret = process.env.ENODE_CLIENT_SECRET ?? '';
  readonly oauthUrl =
    process.env.ENODE_OAUTH_URL ??
    'https://oauth.sandbox.enode.io/oauth2/token';
  readonly apiUrl =
    process.env.ENODE_API_URL ?? 'https://enode-api.sandbox.enode.io';
  /** Pins the response schema; bump deliberately when adopting a new version. */
  readonly apiVersion = process.env.ENODE_API_VERSION ?? '2024-10-01';

  /** Integration is inert unless both client credentials are present. */
  get enabled(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  /**
   * Parsed `ENODE_DEVICE_MAP` — a JSON array of {inverterId, deviceExternalId}.
   * Malformed entries are dropped with a warning rather than crashing boot.
   */
  get deviceMappings(): EnodeDeviceMapping[] {
    const raw = process.env.ENODE_DEVICE_MAP;
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.logger.warn('ENODE_DEVICE_MAP is not a JSON array; ignoring');
        return [];
      }
      return parsed.filter(
        (m): m is EnodeDeviceMapping =>
          m &&
          typeof m.inverterId === 'string' &&
          typeof m.deviceExternalId === 'string',
      );
    } catch (e) {
      this.logger.warn(
        `ENODE_DEVICE_MAP is not valid JSON; ignoring (${
          (e as Error)?.message ?? e
        })`,
      );
      return [];
    }
  }
}
