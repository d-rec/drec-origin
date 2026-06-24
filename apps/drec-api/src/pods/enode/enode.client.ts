import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { EnodeAuthService } from './enode-auth.service';
import { EnodeConfig } from './enode.config';
import { EnodeInverter, EnodeListResponse } from './enode.types';

/**
 * Thin HTTP client for the Enode inverter resource.
 *
 * Note: the live API serves the flat collection at `/inverters` (the
 * `/solar-inverters` path in some docs returns 404 on this version), and the
 * `/statistics` endpoint is intentionally not used — it is cached / vendor
 * throttled and returns null on fresh reads, so we diff the lifetime counter
 * from these snapshots instead (see EnodeSyncService).
 */
@Injectable()
export class EnodeClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: EnodeConfig,
    private readonly auth: EnodeAuthService,
  ) {}

  private async headers(): Promise<Record<string, string>> {
    const token = await this.auth.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Enode-Version': this.config.apiVersion,
    };
  }

  async getInverter(inverterId: string): Promise<EnodeInverter> {
    const { data } = await firstValueFrom(
      this.http.get<EnodeInverter>(
        `${this.config.apiUrl}/inverters/${inverterId}`,
        { headers: await this.headers() },
      ),
    );
    return data;
  }

  async listInverters(): Promise<EnodeInverter[]> {
    const { data } = await firstValueFrom(
      this.http.get<EnodeListResponse<EnodeInverter>>(
        `${this.config.apiUrl}/inverters`,
        { headers: await this.headers() },
      ),
    );
    return data?.data ?? [];
  }
}
