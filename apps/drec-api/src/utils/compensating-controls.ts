import { SourceAccessMode } from './enums';

/**
 * D-REC §3.9: Compensating controls evaluation for Mode 4 devices.
 *
 * Mode 4 has the lowest data trust level. Before approval, a set of
 * compensating controls must be satisfied to ensure data integrity.
 */

export interface CompensatingControlResult {
  id: string;
  label: string;
  satisfied: boolean;
  detail: string;
}

export interface CompensatingControlsEvaluation {
  isMode4: boolean;
  allSatisfied: boolean;
  controls: CompensatingControlResult[];
}

/**
 * Check whether a device requires compensating controls (Mode 4 only).
 */
export function requiresCompensatingControls(
  mode?: SourceAccessMode | null,
): boolean {
  return mode === SourceAccessMode.Mode4_CompensatingControls;
}
