/**
 * Resolve the DC nameplate capacity (kWp) to use for the production-ceiling /
 * Solar GSA yield calculations.
 *
 * `device.capacity` is the AC nameplate; `device.dcCapacity` (`dc_capacity`) is
 * the DC nameplate and is nullable / populated going forward only. The ceiling
 * must be computed on DC, so callers use this helper to read DC when present and
 * fall back to the AC `capacity` otherwise — a null `dc_capacity` therefore
 * reproduces the historical (pre-split) ceiling behaviour exactly.
 *
 * Tolerant of both hydrated entity objects (`dcCapacity`, camelCase) and raw
 * `pg` result rows (`dc_capacity`, and `double precision` returned as a string).
 * Returns 0 when nothing usable is present, matching the previous
 * `device.capacity ? parseFloat(device.capacity) : 0` guard at the call sites.
 */
export function getDcCapacity(d: {
  dcCapacity?: number | string | null;
  dc_capacity?: number | string | null;
  capacity?: number | string | null;
}): number {
  const dc = d.dcCapacity ?? d.dc_capacity;
  const picked = dc != null && dc !== '' ? dc : d.capacity;
  const n = typeof picked === 'string' ? parseFloat(picked) : picked ?? 0;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}
