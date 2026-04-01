import { SourceAccessMode } from './enums';

/**
 * D-REC §3.3: Source-access mode verification rules.
 *
 * Each mode has specific document requirements and verification checks
 * that must be satisfied beyond the baseline evidence requirements
 * (which are driven by operating configuration — see evidence-requirements.ts).
 */

export interface ModeVerificationRule {
  /** Human-readable label */
  label: string;
  /** Document types that must be present for this mode */
  requiredDocuments: string[];
  /** Document types that are recommended but not blocking */
  recommendedDocuments: string[];
  /** Additional programmatic checks (keys reference check functions) */
  checks: ModeCheck[];
}

export interface ModeCheck {
  id: string;
  label: string;
  description: string;
}

export const SOURCE_ACCESS_VERIFICATION: Record<
  SourceAccessMode,
  ModeVerificationRule
> = {
  [SourceAccessMode.Mode1_DirectAPI]: {
    label: 'Mode 1 — Direct API-based source access',
    requiredDocuments: ['METERING_EVIDENCE', 'SCREENSHOTS'],
    recommendedDocuments: ['SINGLE_LINE_DIAGRAM'],
    checks: [
      {
        id: 'api_screenshots',
        label: 'API data screenshots',
        description:
          'Screenshots must show API-sourced production data with timestamps',
      },
      {
        id: 'metering_api_source',
        label: 'Metering from API source',
        description:
          'Metering evidence must reference the API data source (inverter/logger)',
      },
    ],
  },

  [SourceAccessMode.Mode2_PortalAccess]: {
    label: 'Mode 2 — Direct portal access',
    requiredDocuments: ['METERING_EVIDENCE', 'SCREENSHOTS'],
    recommendedDocuments: ['SINGLE_LINE_DIAGRAM'],
    checks: [
      {
        id: 'portal_screenshots',
        label: 'Portal access screenshots',
        description:
          'Screenshots must show portal login and data export screens',
      },
      {
        id: 'metering_portal_source',
        label: 'Metering from portal',
        description:
          'Metering evidence must show data retrieved from the monitoring portal',
      },
    ],
  },

  [SourceAccessMode.Mode3_FileSubmission]: {
    label: 'Mode 3 — Source-linked file submission',
    requiredDocuments: ['METERING_EVIDENCE', 'SCREENSHOTS', 'FORM_SF_02'],
    recommendedDocuments: ['SINGLE_LINE_DIAGRAM', 'COD_PROOF'],
    checks: [
      {
        id: 'file_provenance',
        label: 'File provenance',
        description:
          'Screenshots must show the source system from which files were exported',
      },
      {
        id: 'metering_file_metadata',
        label: 'Source metadata in metering files',
        description:
          'Metering evidence files must contain source system metadata or export headers',
      },
    ],
  },

  [SourceAccessMode.Mode4_CompensatingControls]: {
    label: 'Mode 4 — Submitted data with compensating controls',
    requiredDocuments: [
      'METERING_EVIDENCE',
      'SCREENSHOTS',
      'FORM_SF_02',
      'SF_02C',
      'COD_PROOF',
    ],
    recommendedDocuments: ['SINGLE_LINE_DIAGRAM', 'PROJECT_PHOTOS'],
    checks: [
      {
        id: 'compensating_evidence',
        label: 'Compensating control evidence',
        description:
          'Screenshots must document the compensating controls applied (e.g. third-party attestation, cross-checks)',
      },
      {
        id: 'cod_attestation',
        label: 'COD / third-party attestation',
        description:
          'COD proof or equivalent third-party attestation document is required for Mode 4',
      },
      {
        id: 'enhanced_metering',
        label: 'Enhanced metering evidence',
        description:
          'Metering evidence must include additional detail to compensate for indirect data access',
      },
    ],
  },
};

export function getSourceAccessVerification(
  mode?: SourceAccessMode | null,
): ModeVerificationRule | null {
  if (!mode) return null;
  return SOURCE_ACCESS_VERIFICATION[mode] ?? null;
}
