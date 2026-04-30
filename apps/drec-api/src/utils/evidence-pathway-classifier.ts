import {
  OperatingConfiguration,
  SourceAccessMode,
  EvidencePathway,
} from './enums';
import {
  EvidenceRequirements,
  getEvidenceRequirements,
} from './evidence-requirements';
import {
  ModeVerificationRule,
  getSourceAccessVerification,
} from './source-access-verification';

/**
 * D-REC §3.1: Classify a device into a formal evidence pathway
 * based on its operating configuration and source-access mode.
 *
 * Returns null if either dimension is missing (pathway cannot be determined).
 */
export function classifyEvidencePathway(
  operatingConfig?: OperatingConfiguration | null,
  sourceAccessMode?: SourceAccessMode | null,
): EvidencePathway | null {
  if (!operatingConfig || !sourceAccessMode) return null;

  const isOffGrid =
    operatingConfig === OperatingConfiguration.OffGrid ||
    operatingConfig === OperatingConfiguration.DualModeHybrid;

  const isDirect =
    sourceAccessMode === SourceAccessMode.Mode1_DirectAPI ||
    sourceAccessMode === SourceAccessMode.Mode2_PortalAccess;

  const isFileBased =
    sourceAccessMode === SourceAccessMode.Mode3_FileSubmission;

  const isCompensating =
    sourceAccessMode === SourceAccessMode.Mode4_CompensatingControls;

  if (isOffGrid) {
    return isDirect
      ? EvidencePathway.DirectOffGrid
      : EvidencePathway.CompensatingOffGrid;
  }

  // Grid-connected (no-export, permitted export, full export)
  if (isDirect) return EvidencePathway.DirectGrid;
  if (isFileBased) return EvidencePathway.FileBasedGrid;
  if (isCompensating) return EvidencePathway.CompensatingGrid;

  return null;
}

/**
 * Combined requirements for a classified evidence pathway.
 * Merges operating-config document requirements with mode-specific rules.
 */
export interface PathwayRequirements {
  pathway: EvidencePathway;
  evidenceRequirements: EvidenceRequirements;
  modeRules: ModeVerificationRule | null;
}

export function getPathwayRequirements(
  operatingConfig?: OperatingConfiguration | null,
  sourceAccessMode?: SourceAccessMode | null,
): PathwayRequirements | null {
  const pathway = classifyEvidencePathway(operatingConfig, sourceAccessMode);
  if (!pathway) return null;

  return {
    pathway,
    evidenceRequirements: getEvidenceRequirements(operatingConfig),
    modeRules: getSourceAccessVerification(sourceAccessMode),
  };
}
