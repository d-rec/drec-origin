import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { EnodeConfig } from './enode.config';
import { EnodeTokenResponse } from './enode.types';

/**
 * Caches an Enode OAuth2 client-credentials bearer token.
 *
 * Tokens live ~1h (`expires_in: 3599`); we refresh 60s early to avoid racing
 * the expiry. A single cached token is shared across all calls — never fetch
 * one per request.
 */
@Injectable()
export class EnodeAuthService {
  private readonly logger = new Logger(EnodeAuthService.name);

  private token: string | null = null;
  /** Epoch ms after which the cached token must be refreshed. */
  private expiresAt = 0;

  constructor(
    private readonly http: HttpService,
    private readonly config: EnodeConfig,
  ) {}

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && now < this.expiresAt) {
      return this.token;
    }

    const basic = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString('base64');
    const body = new URLSearchParams({ grant_type: 'client_credentials' });

    const { data } = await firstValueFrom(
      this.http.post<EnodeTokenResponse>(
        this.config.oauthUrl,
        body.toString(),
        {
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    this.token = data.access_token;
    // Refresh 60s before the stated expiry to absorb clock skew / latency.
    this.expiresAt = now + Math.max(0, data.expires_in - 60) * 1000;
    this.logger.debug(
      `Obtained Enode access token (valid ~${data.expires_in}s)`,
    );
    return this.token;
  }
}
