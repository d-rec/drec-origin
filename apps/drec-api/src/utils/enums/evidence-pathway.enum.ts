/**
 * D-REC §3.1: Formal evidence-pathway classification.
 *
 * The pathway is derived from a device's operating configuration
 * and source-access mode. It determines the combined set of
 * document requirements and verification intensity.
 */
export enum EvidencePathway {
  /** Mode 1/2 + grid-connected configs — direct data access, standard docs */
  DirectGrid = 'Direct Grid-Connected',

  /** Mode 3 + grid-connected configs — file-based, needs provenance checks */
  FileBasedGrid = 'File-Based Grid-Connected',

  /** Mode 4 + grid-connected configs — compensating controls required */
  CompensatingGrid = 'Compensating Grid-Connected',

  /** Mode 1/2 + off-grid or hybrid — direct access but limited infrastructure */
  DirectOffGrid = 'Direct Off-Grid',

  /** Mode 3/4 + off-grid or hybrid — highest verification burden */
  CompensatingOffGrid = 'Compensating Off-Grid',
}
