/**
 * Static model parameters, mirroring Kartik's `config.py`.
 *
 * The Python upstream revision this matches is the one under review in
 * KNaik1695/solar-monthly-predictionModel PR #1 (fixed days-vector indexing,
 * pre-COD guard, and Model 2 Case B correction). If upstream shifts any of
 * these numbers, update here too.
 */
export const SOLAR_MODEL_CONFIG = {
  /** Linear-regression baseline annual yield per kW (kWh/kWp/year). */
  staticAvg: 1520,
  /** Year-over-year degradation factor. */
  DF: 0.005,
  /** Default assumed performance factor. */
  PF_avg: 0.778,
  /** Semver-tagged model versions exposed in output so downstream consumers
   * can detect when the estimate changed. */
  solarGsaVersion: 'v1.2.0',
  linearRegressionVersion: 'v1.1.0',
};
