# solar-yield

TypeScript port of [`KNaik1695/solar-monthly-predictionModel`](https://github.com/KNaik1695/solar-monthly-predictionModel) — a nearest-neighbour lookup over a precomputed Global Solar Atlas grid that estimates monthly + annual PV yield for a site.

Tracks the fix branch under review as [PR #1](https://github.com/KNaik1695/solar-monthly-predictionModel/pull/1): correct days-vector indexing in Case B, a pre-COD guard, and the correction factor applied to Model 2 Case B.

## What it is / isn't

- **Is:** a typical-year climatology — same estimate regardless of the weather that actually occurred in the queried year.
- **Isn't:** a weather-corrected estimator. Inter-annual variability can swing real output ±10–15% at monthly scale, ±5–8% annual.

Use it for **past-generation confirmations against a tolerance band**, not as ground truth.

## Usage

```ts
import { SolarYieldModule } from './pods/solar-yield/solar-yield.module';
// register SolarYieldModule in your AppModule

// then inject:
constructor(private readonly solar: SolarYieldService) {}

const result = this.solar.getSolarEnergy(
  19.745365,        // lat
  105.901337,       // lon
  29.25,            // capacity in kW
  '2024-06-01',     // Commercial Operation Date
  2025,             // target year
);
// → { Model_1_Outputs: { Yield_kWh, Monthly_kWh, ... }, Model_2_Outputs: { ... } }
```

## Data file

The service needs `pv_potential_3d.npz` (~73 MB, ~311 MB uncompressed) at runtime. It is **not** committed to this repo.

Point the env var `SOLAR_GRID_NPZ_PATH` at an absolute path:

```bash
SOLAR_GRID_NPZ_PATH=/opt/drec/solar/pv_potential_3d.npz pnpm start:dev
```

Source of truth: [`KNaik1695/solar-monthly-predictionModel/pv_potential_3d.npz`](https://github.com/KNaik1695/solar-monthly-predictionModel/blob/main/pv_potential_3d.npz). Pin to the same commit you ported against (currently the PR#1 branch). At deploy time, provide the file via a volume mount or init-container download; at local dev, symlink or copy in.

On startup, the service parses the `.npz` (no scipy/numpy needed — stdlib `zlib.inflateRawSync` + a small `.npy` header parser in `npz-reader.ts`) and keeps the grid in memory as typed arrays. Grid load time: ~200–400 ms on a laptop; ~330 MB resident memory.

## Known caveats

- **Out-of-bounds coordinates throw `RangeError`.** The Python reference silently returns 0 (scipy's `fill_value=0` default); we diverge here so callers can distinguish a typo'd coordinate from a real zero (polar winter, etc.).
- **Nearest-neighbour at grid resolution (1/12°, ~9 km).** Two sites within ~5 km of each other may resolve to the same grid cell and return identical estimates.
- **Model 2 is weak.** It's a `capacity × static-annual-yield-per-kW` baseline that exists for parity with the Python output shape. It makes no use of the grid at all. Treat it as a sanity-check baseline, not an independent estimate.

## Updating to match upstream changes

If Kartik ships a new version of `prediction_model.py`, update in lockstep:

- `solar-yield.service.ts` for algorithm changes
- `config.ts` for constant changes (`staticAvg`, `PF_avg`, `DF`, version strings)
- `solar-yield.service.spec.ts` for any behavior changes

The tests use a synthetic identity grid (every month returns a trivial value), so they cover the algorithm without needing the real `.npz` in CI.
