/**
 * Subset of the Enode API shapes this integration relies on.
 * Only the fields actually consumed are typed; the live payload has more.
 * See https://developers.enode.com/api/reference (resource: inverters).
 */

export interface EnodeProductionState {
  /** Instantaneous output in kW (null when not producing / unknown). */
  productionRate: number | null;
  isProducing: boolean;
  /** Cumulative lifetime energy in kWh — the signal we diff for reads. */
  totalLifetimeProduction: number | null;
  /** ISO-8601 timestamp of the last vendor update, or null. */
  lastUpdated: string | null;
}

export interface EnodeInverter {
  id: string;
  userId: string;
  vendor: string;
  isReachable: boolean;
  /** IANA timezone, e.g. "Europe/Oslo"; may be null. */
  timezone: string | null;
  productionState: EnodeProductionState;
}

export interface EnodeListResponse<T> {
  data: T[];
  pagination: { after: string | null; before: string | null };
}

export interface EnodeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
