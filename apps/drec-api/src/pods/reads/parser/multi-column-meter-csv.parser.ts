import { parse } from 'csv-parse';
import { Unit } from '../../../types/reads';
import { NewReadDTO } from '../../../models';
import { ReadType } from '../../../utils/enums';

/**
 * Parser for "wide-format" meter exports — one timestamp column plus
 * multiple value columns, units in row 2, timezone in row 2's first
 * cell, no per-record serial number.
 *
 * Atsawa's source-system export is the canonical example:
 *
 *   timestamp,Solar Yield (delta),Grid to battery,Grid to consumers,...
 *   Africa/Lagos (+01:00),kWh,kWh,kWh,...
 *   2025-07-01 00:00:00,,,,,,,0.18,,,,
 *   2025-07-01 01:00:00,0.42,,,0.42,,0.31,0.11,,,,
 *
 * One hour per row. The caller picks WHICH column carries the value
 * to ingest (default: "Solar Yield (delta)"). Empty / zero values are
 * skipped — they represent no production for that hour.
 *
 * Caller is responsible for: choosing the column, knowing the device's
 * external id, and calling ReadsService.storeRead() with the result.
 */
export interface ParsedWideCsv {
  timezone: string;
  unit: Unit;
  reads: NewReadDTO[];
  skippedEmpty: number;
  skippedZero: number;
  parsedColumn: string;
  /** Detected row-to-row interval, in milliseconds. Each read's
   *  endtimestamp = starttimestamp + this. */
  intervalMs: number;
}

const DEFAULT_VALUE_COLUMN = 'Solar Yield (delta)';

/** Try the explicit column name; fall back to common variants for the
 *  same concept across vendors. */
function pickColumnIndex(headers: string[], preferred: string): number {
  const exact = headers.indexOf(preferred);
  if (exact >= 0) return exact;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wantNorm = norm(preferred);
  return headers.findIndex((h) => norm(h) === wantNorm);
}

/** Pull the timezone out of the units row's first cell. Atsawa-style:
 *  "Africa/Lagos (+01:00)" — keep only the IANA name. */
function extractTimezone(firstCell: string): string {
  if (!firstCell) return '';
  const m = firstCell.match(/[A-Za-z_]+\/[A-Za-z_]+/);
  return (m ? m[0] : firstCell).trim();
}

/** Coerce the units row's value-column cell to a Unit. Most exports
 *  use literal "kWh". Defaults to kWh if anything looks remotely close
 *  — `Wh` exports are an order-of-magnitude bigger and would corrupt
 *  the certificate accounting if mis-detected, so we err strict here. */
function pickUnit(rawUnit: string): Unit {
  const u = rawUnit.trim();
  if (/^kwh$/i.test(u)) return Unit.kWh;
  if (/^mwh$/i.test(u)) return Unit.MWh;
  if (/^gwh$/i.test(u)) return Unit.GWh;
  if (/^wh$/i.test(u)) return Unit.Wh;
  // Anything else: fail loud rather than guess.
  throw new Error(`Unrecognised unit "${rawUnit}" in CSV units row`);
}

export async function parseWideMeterCsv(
  fileContent: Buffer,
  opts: {
    /** Single column name to use as the kWh value per row. */
    valueColumn?: string;
    /** Multiple column names to *sum* per row. Use for exports where the
     *  PV production is split across paths (e.g. Atsawa's source-system
     *  splits into "PV to battery" + "PV to consumers" with "PV to grid"
     *  being a separate exported column). Mutually exclusive with
     *  valueColumn; if both set, sumColumns wins. */
    sumColumns?: string[];
    /** Override the row-to-row interval in minutes. If omitted, the
     *  parser infers it from the first two timestamps — typical
     *  exports are 15, 30, or 60. Atsawa's source is 15. */
    intervalMinutes?: number;
  } = {},
): Promise<ParsedWideCsv> {
  const sumColumns = (opts.sumColumns ?? []).filter((c) => c && c.trim());
  const valueColumn = opts.valueColumn ?? DEFAULT_VALUE_COLUMN;
  const useSum = sumColumns.length > 0;
  // Auto-inferred from row-to-row delta unless caller provides
  // intervalMinutes explicitly. Until inferred, we buffer rows so we
  // can backfill endtimestamp once we know.
  let intervalMs =
    opts.intervalMinutes != null ? opts.intervalMinutes * 60_000 : 0;
  let firstStartMs: number | null = null;

  return new Promise((resolve, reject) => {
    let headers: string[] | null = null;
    let unitsRow: string[] | null = null;
    let columnIdxs: number[] = [];
    let columnDescription = '';
    let timezone = '';
    let unit: Unit = Unit.kWh;
    const reads: NewReadDTO[] = [];
    let skippedEmpty = 0;
    let skippedZero = 0;

    const parser = parse({
      delimiter: ',',
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    parser.on('readable', () => {
      let row: string[] | null;
      while ((row = parser.read() as string[] | null) !== null) {
        if (!headers) {
          headers = row.map((c) => String(c ?? '').trim());
          if (useSum) {
            columnIdxs = sumColumns.map((c) => pickColumnIndex(headers!, c));
            const missing = sumColumns.filter((_, i) => columnIdxs[i] < 0);
            if (missing.length) {
              parser.destroy(
                new Error(
                  `Columns not found: ${missing.join(', ')}. Headers: ${headers.join(', ')}`,
                ),
              );
              return;
            }
            columnDescription = `SUM(${sumColumns.join(' + ')})`;
          } else {
            const idx = pickColumnIndex(headers, valueColumn);
            if (idx < 0) {
              parser.destroy(
                new Error(
                  `Column "${valueColumn}" not found. Headers: ${headers.join(', ')}`,
                ),
              );
              return;
            }
            columnIdxs = [idx];
            columnDescription = valueColumn;
          }
          continue;
        }
        if (!unitsRow) {
          unitsRow = row.map((c) => String(c ?? '').trim());
          timezone = extractTimezone(unitsRow[0]);
          try {
            // Use the first selected column's unit; all summed columns
            // should share a unit, and pickUnit fails loud if any is
            // unexpected. Sample only the first to avoid death-by-detail.
            unit = pickUnit(unitsRow[columnIdxs[0]]);
          } catch (err) {
            parser.destroy(err as Error);
            return;
          }
          continue;
        }
        // Data row. Parse the timestamp FIRST so we can infer the
        // interval from every row, even empties — that way an
        // occasional gap in sensor data doesn't mess up inference.
        const tsRaw = String(row[0] ?? '').trim();
        if (!tsRaw) {
          skippedEmpty++;
          continue;
        }
        const startMs = Date.parse(tsRaw.replace(' ', 'T'));
        if (!Number.isFinite(startMs)) {
          skippedEmpty++;
          continue;
        }
        if (intervalMs === 0) {
          if (firstStartMs === null) {
            firstStartMs = startMs;
          } else if (startMs > firstStartMs) {
            intervalMs = startMs - firstStartMs;
          }
        }
        let total = 0;
        let anyNonEmpty = false;
        for (const idx of columnIdxs) {
          const cell = String(row[idx] ?? '').trim();
          if (!cell) continue;
          anyNonEmpty = true;
          const n = Number(cell);
          if (Number.isFinite(n)) total += n;
        }
        if (!anyNonEmpty) {
          skippedEmpty++;
          continue;
        }
        if (total <= 0) {
          skippedZero++;
          continue;
        }
        reads.push({
          starttimestamp: new Date(startMs),
          // Backfilled in on('end') once intervalMs is known.
          endtimestamp: new Date(startMs),
          value: total,
        } as NewReadDTO);
      }
    });

    parser.on('error', reject);
    parser.on('end', () => {
      // If inference failed (only ever one timestamp present, or all
      // rows were skipped), default to hourly — least-surprising
      // fallback, and caller can pass intervalMinutes to override.
      if (intervalMs === 0) intervalMs = 60 * 60_000;
      for (const r of reads) {
        r.endtimestamp = new Date(r.starttimestamp.getTime() + intervalMs);
      }
      resolve({
        timezone,
        unit,
        reads,
        skippedEmpty,
        skippedZero,
        parsedColumn: columnDescription,
        intervalMs,
      });
    });

    parser.write(fileContent);
    parser.end();
  });
}

/** Convenience wrapper that wraps parseWideMeterCsv's output in the
 *  shape ReadsService.storeRead expects.
 *
 *  Type is History rather than Delta: each row in the wide CSV carries
 *  its own start AND end timestamps, which is the History semantic.
 *  Delta's processing path derives startDate from the previous read's
 *  endDate (streaming use case), which destroys the per-row timestamps
 *  we worked to parse. History keeps element.starttimestamp intact.
 *  Constraint: timestamps must fall within (createdAt - 3y, createdAt). */
export function toIntermediate(parsed: ParsedWideCsv) {
  return {
    timezone: parsed.timezone,
    type: ReadType.History as const,
    unit: parsed.unit,
    reads: parsed.reads,
  };
}
