/**
 * Verifies that a device's declared country matches the country inferred
 * from its lat/lng by a reverse-geocoder, with a neutral fallback for
 * territories under active political dispute.
 *
 * Design: we auto-verify the 99.9% and surface the 0.1%. For disputed
 * zones we never take a side — the reviewer is shown both the reverse-
 * geocoder's answer and the registrant's claim and decides.
 */

import {
  DisputedTerritory,
  findDisputedTerritory,
} from './disputed-territories';
import { countryCodesList } from '../models/country-code';

export type CountryMatchStatus =
  | 'match' // declared country matches reverse-geocoded country
  | 'disputed' // mismatch, but the point is inside a known disputed-territory polygon
  | 'mismatch' // mismatch outside any disputed zone — likely an error
  | 'skip'; // missing coords / missing country / reverse-geocode failed

export interface CountryMatchResult {
  status: CountryMatchStatus;
  declaredCountry: string | null;
  resolvedCountry: string | null;
  disputed?: {
    id: string;
    name: string;
    claimants: string[];
  };
  flags: CountryMatchFlag[];
  /** Only present when status === 'skip'; carries the reason. */
  reason?: string;
}

export interface CountryMatchFlag {
  type: 'mismatch' | 'disputed-border';
  severity: 'warning' | 'critical';
  description: string;
}

/** alpha-2 → alpha-3 using the project's canonical country list. */
function alpha2ToAlpha3(alpha2: string): string | null {
  const match = countryCodesList.find(
    (c) => c.alpha2.toUpperCase() === alpha2.toUpperCase(),
  );
  return match?.alpha3 ?? null;
}

/** Normalize whatever-case to uppercase alpha-3, best-effort. */
function normalizeCountry(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length === 3) return trimmed;
  if (trimmed.length === 2) return alpha2ToAlpha3(trimmed);
  return null;
}

export interface CountryMatchInput {
  lat: number | null | undefined;
  lng: number | null | undefined;
  /** Registrant-declared country code (alpha-2 or alpha-3). */
  declaredCountry: string | null | undefined;
  /**
   * Reverse-geocode result — caller supplies it so this utility stays
   * pure/testable. `null` means the caller tried and failed (e.g. API
   * timeout); `undefined` means the caller didn't attempt.
   */
  resolvedAlpha2: string | null | undefined;
}

export function computeCountryMatchVerification(
  input: CountryMatchInput,
): CountryMatchResult {
  const declared = normalizeCountry(input.declaredCountry);
  const resolved =
    input.resolvedAlpha2 == null ? null : alpha2ToAlpha3(input.resolvedAlpha2);

  // Need both lat/lng and a declared country to say anything meaningful.
  if (
    input.lat == null ||
    input.lng == null ||
    Number.isNaN(input.lat) ||
    Number.isNaN(input.lng)
  ) {
    return {
      status: 'skip',
      declaredCountry: declared,
      resolvedCountry: resolved,
      flags: [],
      reason: 'missing coordinates',
    };
  }
  if (!declared) {
    return {
      status: 'skip',
      declaredCountry: null,
      resolvedCountry: resolved,
      flags: [],
      reason: 'missing declared country',
    };
  }
  if (input.resolvedAlpha2 === null) {
    return {
      status: 'skip',
      declaredCountry: declared,
      resolvedCountry: null,
      flags: [],
      reason: 'reverse-geocode failed',
    };
  }
  if (input.resolvedAlpha2 === undefined) {
    return {
      status: 'skip',
      declaredCountry: declared,
      resolvedCountry: null,
      flags: [],
      reason: 'reverse-geocode not attempted',
    };
  }

  if (resolved && resolved === declared) {
    return {
      status: 'match',
      declaredCountry: declared,
      resolvedCountry: resolved,
      flags: [],
    };
  }

  // Mismatched. Is the point inside a known disputed-territory polygon?
  const territory: DisputedTerritory | null = findDisputedTerritory(
    input.lat,
    input.lng,
  );
  if (territory) {
    // Only treat as "disputed" if the declared country is actually one of
    // the claimants — otherwise it's a plain mismatch that happens to sit
    // inside a disputed zone, which is still suspect.
    const claimantsMatch = territory.claimants.includes(declared);
    if (claimantsMatch) {
      return {
        status: 'disputed',
        declaredCountry: declared,
        resolvedCountry: resolved,
        disputed: {
          id: territory.id,
          name: territory.name,
          claimants: territory.claimants,
        },
        flags: [
          {
            type: 'disputed-border',
            severity: 'warning',
            description: `Coordinates fall inside ${territory.name}, which is claimed by ${territory.claimants.join(', ')}. Registrant declared ${declared}; reverse-geocode returned ${resolved ?? 'unknown'}. Reviewer judgment required — do not auto-reject.`,
          },
        ],
      };
    }
  }

  return {
    status: 'mismatch',
    declaredCountry: declared,
    resolvedCountry: resolved,
    flags: [
      {
        type: 'mismatch',
        severity: 'critical',
        description: `Declared country (${declared}) does not match the country inferred from lat/lng (${resolved ?? 'unknown'}). Verify coordinates or country code.`,
      },
    ],
  };
}
