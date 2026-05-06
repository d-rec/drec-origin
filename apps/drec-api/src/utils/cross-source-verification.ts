/**
 * D-REC §3.10: Cross-source verification.
 *
 * Compares actual meter readings against irradiance-modeled production
 * using a regression-based Performance Factor (PF).
 *
 * PF = Σ(E_model,i · E_actual,i) / Σ(E_model,i²)
 *
 * This is the least-squares optimal scalar mapping modeled to actual.
 * It weights months with higher model output more heavily, which is
 * statistically correct since those months carry more signal.
 */

export interface MonthlyComparison {
  /** YYYY-MM */
  month: string;
  actualKwh: number;
  modelKwh: number;
  ratio: number;
}

export interface CrossSourceResult {
  /** Regression-based Performance Factor */
  performanceFactor: number;
  /** Simple ratio (Σactual / Σmodel) for reference */
  simpleRatio: number;
  /** Number of aligned months used */
  monthsCompared: number;
  /** R² goodness of fit (0–1, higher = more consistent) */
  rSquared: number;
  /** True when there are no nonzero actual readings — PF/R² are degenerate. */
  noActualData: boolean;
  /** Per-month breakdown */
  months: MonthlyComparison[];
  /** Flags */
  flags: CrossSourceFlag[];
}

export interface CrossSourceFlag {
  type: 'overproduction' | 'underproduction' | 'inconsistent' | 'seasonal_anomaly';
  severity: 'warning' | 'critical';
  description: string;
}

/**
 * Compute the regression-based PF and diagnostics.
 *
 * @param months  Array of { month, actualKwh, modelKwh } — must have at least 1 entry
 */
export function computeCrossSourceVerification(
  months: MonthlyComparison[],
): CrossSourceResult {
  const n = months.length;

  // Compute PF = Σ(model × actual) / Σ(model²)
  let sumModelActual = 0;
  let sumModelSq = 0;
  let sumActual = 0;
  let sumModel = 0;

  for (const m of months) {
    sumModelActual += m.modelKwh * m.actualKwh;
    sumModelSq += m.modelKwh * m.modelKwh;
    sumActual += m.actualKwh;
    sumModel += m.modelKwh;
  }

  const performanceFactor =
    sumModelSq > 0 ? sumModelActual / sumModelSq : 0;
  const simpleRatio = sumModel > 0 ? sumActual / sumModel : 0;

  // Compute ratios per month
  for (const m of months) {
    m.ratio = m.modelKwh > 0 ? m.actualKwh / m.modelKwh : 0;
  }

  // R² — how well PF × model explains actual
  let ssTot = 0;
  let ssRes = 0;
  const meanActual = n > 0 ? sumActual / n : 0;
  for (const m of months) {
    ssTot += (m.actualKwh - meanActual) ** 2;
    ssRes += (m.actualKwh - performanceFactor * m.modelKwh) ** 2;
  }
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 1;

  // Generate flags
  const flags: CrossSourceFlag[] = [];

  if (performanceFactor > 1.2) {
    flags.push({
      type: 'overproduction',
      severity: performanceFactor > 1.5 ? 'critical' : 'warning',
      description:
        `PF = ${performanceFactor.toFixed(2)} — actual production exceeds modeled by ` +
        `${Math.round((performanceFactor - 1) * 100)}%. Possible metering error or incorrect capacity.`,
    });
  }

  if (performanceFactor > 0 && performanceFactor < 0.3) {
    flags.push({
      type: 'underproduction',
      severity: 'warning',
      description:
        `PF = ${performanceFactor.toFixed(2)} — actual production is only ` +
        `${Math.round(performanceFactor * 100)}% of modeled. Possible shading, degradation, or incorrect location.`,
    });
  }

  if (rSquared < 0.5 && n >= 3) {
    flags.push({
      type: 'inconsistent',
      severity: 'warning',
      description:
        `R² = ${rSquared.toFixed(2)} — poor correlation between modeled and actual. ` +
        `Production pattern does not follow expected seasonal variation.`,
    });
  }

  // Check for individual months that deviate > 2× from PF
  for (const m of months) {
    if (m.modelKwh > 0) {
      const expected = performanceFactor * m.modelKwh;
      if (expected > 0 && m.actualKwh > expected * 2) {
        flags.push({
          type: 'seasonal_anomaly',
          severity: 'warning',
          description:
            `Month ${m.month}: actual (${m.actualKwh.toFixed(0)} kWh) ` +
            `is ${(m.actualKwh / expected).toFixed(1)}× the expected ${expected.toFixed(0)} kWh.`,
        });
      }
    }
  }

  return {
    performanceFactor: Math.round(performanceFactor * 1000) / 1000,
    simpleRatio: Math.round(simpleRatio * 1000) / 1000,
    monthsCompared: n,
    rSquared: Math.round(rSquared * 1000) / 1000,
    noActualData: sumActual === 0,
    months,
    flags,
  };
}
