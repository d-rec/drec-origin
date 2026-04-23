import { OperatingConfiguration } from './enums';

/**
 * Document requirement level per operating configuration.
 * Derived from the D-REC Methodology Overview for I-REC(E), Tables 1 and 5.
 */
export type RequirementLevel = 'required' | 'recommended' | 'optional';

export interface EvidenceRequirements {
  FORM_SF_02: RequirementLevel;
  SF_02C: RequirementLevel;
  SF_02C_OWNERS_DECLARATION: RequirementLevel;
  METERING_EVIDENCE: RequirementLevel;
  SINGLE_LINE_DIAGRAM: RequirementLevel;
  PROJECT_PHOTOS: RequirementLevel;
  COD_PROOF: RequirementLevel;
}

/**
 * Default requirements when no operating config is selected.
 * All mandatory docs stay required; others stay optional.
 */
const DEFAULT_REQUIREMENTS: EvidenceRequirements = {
  FORM_SF_02: 'required',
  SF_02C: 'required',
  SF_02C_OWNERS_DECLARATION: 'required',
  METERING_EVIDENCE: 'required',
  SINGLE_LINE_DIAGRAM: 'required',
  PROJECT_PHOTOS: 'required',
  COD_PROOF: 'required',
};

/**
 * Per-configuration evidence requirements.
 *
 * Grid-connected, no export:
 *   SLD must show no-export config. Metering evidence required to confirm
 *   no export channel. Screenshots recommended (inverter/EMS zero-export
 *   settings).
 *
 * Grid-connected, permitted export:
 *   Metering evidence required (import/export meter channels).
 *   Screenshots recommended (inverter/EMS/RMS export data).
 *   SF-02C required (contractual/regulatory records permitting export).
 *
 * Grid-connected, full export:
 *   Metering evidence required (export meter data).
 *   SF-02C required (utility/offtaker records, open-access documentation).
 *   Screenshots recommended (monitoring and commercial records).
 *
 * Off-grid / islanded:
 *   SLD required (system architecture showing standalone operation).
 *   Metering evidence recommended (monitoring setup, not always available).
 *   Screenshots recommended (operator/project records).
 *
 * Dual-mode / hybrid:
 *   All documents required — both grid-connected and off-grid evidence
 *   needed to establish which mode applies for the claimed period.
 */
export const EVIDENCE_REQUIREMENTS: Record<
  OperatingConfiguration,
  EvidenceRequirements
> = {
  [OperatingConfiguration.GridNoExport]: {
    FORM_SF_02: 'required',
    SF_02C: 'required',
    SF_02C_OWNERS_DECLARATION: 'required',
    METERING_EVIDENCE: 'required',
    SINGLE_LINE_DIAGRAM: 'required', // must show no-export config
    PROJECT_PHOTOS: 'required',
    COD_PROOF: 'required',
  },
  [OperatingConfiguration.GridPermittedExport]: {
    FORM_SF_02: 'required',
    SF_02C: 'required', // contractual/regulatory records permitting export
    SF_02C_OWNERS_DECLARATION: 'required',
    METERING_EVIDENCE: 'required', // import/export meter channels
    SINGLE_LINE_DIAGRAM: 'required',
    PROJECT_PHOTOS: 'required',
    COD_PROOF: 'required',
  },
  [OperatingConfiguration.GridFullExport]: {
    FORM_SF_02: 'required',
    SF_02C: 'required', // utility/offtaker records, open-access docs
    SF_02C_OWNERS_DECLARATION: 'required',
    METERING_EVIDENCE: 'required', // export meter data
    SINGLE_LINE_DIAGRAM: 'required',
    PROJECT_PHOTOS: 'required',
    COD_PROOF: 'required',
  },
  [OperatingConfiguration.OffGrid]: {
    FORM_SF_02: 'required',
    SF_02C: 'required',
    SF_02C_OWNERS_DECLARATION: 'required',
    METERING_EVIDENCE: 'recommended', // monitoring setup, not always available
    SINGLE_LINE_DIAGRAM: 'required', // system architecture showing standalone
    PROJECT_PHOTOS: 'required',
    COD_PROOF: 'required',
  },
  [OperatingConfiguration.DualModeHybrid]: {
    FORM_SF_02: 'required',
    SF_02C: 'required',
    SF_02C_OWNERS_DECLARATION: 'required',
    METERING_EVIDENCE: 'required',
    SINGLE_LINE_DIAGRAM: 'required',
    PROJECT_PHOTOS: 'required',
    COD_PROOF: 'required',
  },
};

export function getEvidenceRequirements(
  config?: OperatingConfiguration | null,
): EvidenceRequirements {
  if (!config) return DEFAULT_REQUIREMENTS;
  return EVIDENCE_REQUIREMENTS[config] ?? DEFAULT_REQUIREMENTS;
}
