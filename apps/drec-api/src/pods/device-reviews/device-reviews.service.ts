import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as exifr from 'exifr';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FileService } from '../file/file.service';
import { EvidencePathway, OperatingConfiguration, OwnershipStatus, SourceAccessMode } from '../../utils/enums';
import {
  getSourceAccessVerification,
  ModeVerificationRule,
  ModeCheck,
} from '../../utils/source-access-verification';
import {
  classifyEvidencePathway,
  getPathwayRequirements,
  PathwayRequirements,
} from '../../utils/evidence-pathway-classifier';
import {
  estimateIrradiance,
  IrradianceEstimate,
} from '../../utils/irradiance-estimate';
import {
  requiresCompensatingControls,
  CompensatingControlResult,
  CompensatingControlsEvaluation,
} from '../../utils/compensating-controls';
import {
  computeCrossSourceVerification,
  CrossSourceResult,
  MonthlyComparison,
} from '../../utils/cross-source-verification';

export interface DocMeta {
  docId: number;
  reviewed: boolean;
}

export interface AssetDto {
  id: string;
  serial: string;
  lat: number | null;
  long: number | null;
  projectName: string;
  capacity: number | null;
  acCapacity: number | null;
  countryCode: string;
  submitterEmail: string;
  reviewer: string;
  dateAdded: Date | null;
  dateSubmitted: Date | null;
  modifiedDate: Date | null;
  status: string;
  notes: string;
  operatingConfiguration: string | null;
  sourceAccessMode: string | null;
  evidencePathway: string | null;
  ownershipStatus: string | null;
  evidentDeviceId: string | null;
  evidentStatus: string | null;
  lastScreenStatus: string | null;
  lastScreenedAt: string | null;
  codProofUrl: string | null;
  sldUrl: string | null;
  sf02Url: string | null;
  sf02cUrl: string | null;
  meteringEvidenceUrl: string | null;
  pictureUrls: string[];
  screenshotUrls: string[];
  docMeta: Record<string, DocMeta>;
}

@Injectable()
export class DeviceReviewsService {
  private readonly logger = new Logger(DeviceReviewsService.name);

  constructor(
    @InjectDataSource() private readonly connection: DataSource,
    private readonly fileService: FileService,
  ) {}

  /**
   * Ensure the device has a classified evidence pathway (§3.1 sequencing rule).
   * If not yet classified, auto-classify from operatingConfiguration + sourceAccessMode.
   * Returns a note string if classification couldn't be determined (missing fields),
   * or null if the pathway is set.
   */
  private async ensurePathwayClassified(
    deviceId: number,
  ): Promise<string | null> {
    const rows: any[] = await this.connection.query(
      `SELECT evidence_pathway, "operatingConfiguration", "sourceAccessMode"
       FROM device WHERE id = $1`,
      [deviceId],
    );
    if (rows.length === 0) return null;
    if (rows[0].evidence_pathway) return null;

    // Try to auto-classify
    const config = rows[0].operatingConfiguration;
    const mode = rows[0].sourceAccessMode;
    if (!config || !mode) {
      return (
        'Evidence pathway could not be auto-classified: ' +
        (!config && !mode
          ? 'operatingConfiguration and sourceAccessMode are not set'
          : !config
            ? 'operatingConfiguration is not set'
            : 'sourceAccessMode is not set') +
        '. Set these fields first for full verification accuracy.'
      );
    }

    await this.classifyDevicePathway(deviceId);
    return null;
  }

  /**
   * D-REC §3.8: Append an immutable audit log entry.
   */
  /**
   * Append an immutable audit log entry.
   * @param ipAddress - Caller's IP address (from request context)
   */
  async logAudit(
    deviceId: number,
    actionType: string,
    detail: string,
    performedBy: string = 'system',
    metadata?: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    const meta = { ...metadata };
    if (ipAddress) meta.ip = ipAddress;
    await this.connection.query(
      `INSERT INTO audit_log (device_id, action_type, detail, performed_by, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [deviceId, actionType, detail, performedBy, Object.keys(meta).length > 0 ? JSON.stringify(meta) : null],
    );
  }

  /**
   * D-REC §3.8: Retrieve the full audit trail for a device.
   */
  async getAuditTrail(deviceId: number): Promise<Array<{
    id: number;
    actionType: string;
    detail: string | null;
    performedBy: string;
    metadata: Record<string, any> | null;
    createdAt: Date;
  }>> {
    return this.connection.query(
      `SELECT id, action_type AS "actionType", detail, performed_by AS "performedBy",
              metadata, created_at AS "createdAt"
       FROM audit_log
       WHERE device_id = $1
       ORDER BY created_at DESC`,
      [deviceId],
    );
  }

  async updateReviewStatus(
    deviceId: number,
    status: string,
    ipAddress?: string,
  ): Promise<{ status: string }> {
    // Try to update existing submission row
    const rows: any[] = await this.connection.query(
      `UPDATE submissions s
       SET status = $2, updated_at = now()
       FROM device d
       WHERE d.id = $1
         AND regexp_replace(lower(d."projectName"), '[^a-z0-9]+', '-', 'g')
           = regexp_replace(s.project_subfolder,
               '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
               '', 'i')
       RETURNING s.status`,
      [deviceId, status],
    );
    if (rows.length > 0) {
      this.logger.log(
        `Device ${deviceId} review status changed to "${status}"`,
      );
      await this.logAudit(deviceId, 'status_change', `Status changed to "${status}"`, 'reviewer', undefined, ipAddress);
      // D-REC §3.1: Classify evidence pathway
      // D-REC §2.7: Verify ownership on approval
      if (status === 'approved') {
        await this.classifyDevicePathway(deviceId);
        await this.verifyOwnership(deviceId);
      }
      // Auto-screen when entering pending — fire-and-forget
      if (status === 'pending') {
        this.autoScreenReport(deviceId).catch((err) =>
          this.logger.warn(`Auto-screen on submission failed for device ${deviceId}: ${err.message}`),
        );
      }
      return { status: rows[0].status };
    }

    // No submission row exists — create one from the device's projectName
    const deviceRows: any[] = await this.connection.query(
      `SELECT "projectName" FROM device WHERE id = $1`,
      [deviceId],
    );
    if (!deviceRows.length) {
      return { status };
    }
    const projectName = deviceRows[0].projectName ?? '';
    const subfolder = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await this.connection.query(
      `INSERT INTO submissions (project_subfolder, submitted_at, status, created_at, updated_at)
       VALUES ($1, now(), $2, now(), now())`,
      [subfolder, status],
    );
    this.logger.log(
      `Device ${deviceId} review status set to "${status}" (new submission created for "${projectName}")`,
    );
    if (status === 'pending') {
      this.autoScreenReport(deviceId).catch((err) =>
        this.logger.warn(`Auto-screen on submission failed for device ${deviceId}: ${err.message}`),
      );
    }
    return { status };
  }

  async refreshSignedUrl(key: string): Promise<{ url: string }> {
    const url = await this.fileService.getSignedUrl(
      decodeURIComponent(key),
      43200,
    );
    return { url };
  }

  async toggleReviewedFlag(docId: number): Promise<{ reviewed: boolean }> {
    const rows: any[] = await this.connection.query(
      `UPDATE documents SET reviewed_flag = NOT reviewed_flag WHERE id = $1 RETURNING reviewed_flag`,
      [docId],
    );
    return { reviewed: !!rows[0]?.reviewed_flag };
  }

  async deleteDocument(docId: number): Promise<void> {
    const deviceId = await this.getDeviceIdForDocument(docId);
    if (deviceId) {
      await this.assertNotApproved(deviceId);
    }

    const rows: any[] = await this.connection.query(
      `SELECT id, url FROM documents WHERE id = $1`,
      [docId],
    );
    if (!rows.length) {
      throw new NotFoundException(`Document ${docId} not found`);
    }
    const doc = rows[0];
    // Delete from S3
    if (doc.url) {
      await this.fileService
        .deleteFileFromS3(decodeURIComponent(doc.url))
        .catch((err) =>
          this.logger.warn(`Failed to delete S3 object: ${err.message}`),
        );
    }
    // Delete from DB
    await this.connection.query(`DELETE FROM documents WHERE id = $1`, [docId]);
    this.logger.log(`Document ${docId} deleted from DB and S3`);
  }

  async getProjectName(deviceId: number): Promise<string> {
    const rows: any[] = await this.connection.query(
      `SELECT "projectName" FROM device WHERE id = $1`,
      [deviceId],
    );
    return rows[0]?.projectName ?? '';
  }

  /**
   * §3.3.3: Documents are immutable once the device review is approved.
   * Throws ForbiddenException if the device's review status is 'approved'.
   */
  async assertNotApproved(deviceId: number): Promise<void> {
    const rows: any[] = await this.connection.query(
      `SELECT s.status
       FROM submissions s
       JOIN device d ON regexp_replace(lower(d."projectName"), '[^a-z0-9]+', '-', 'g')
         = regexp_replace(s.project_subfolder,
             '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
             '', 'i')
       WHERE d.id = $1`,
      [deviceId],
    );
    if (rows.length > 0 && rows[0].status === 'approved') {
      throw new ForbiddenException(
        'Documents cannot be modified after the device review has been approved',
      );
    }
  }

  private async getDeviceIdForDocument(docId: number): Promise<number | null> {
    const rows: any[] = await this.connection.query(
      `SELECT target_id FROM documents WHERE id = $1 AND target_type = 'device'`,
      [docId],
    );
    return rows[0]?.target_id ?? null;
  }

  async detectPanels(imageBase64: string): Promise<any> {
    const url = process.env.ROBOFLOW_WORKFLOW_URL;
    const key = process.env.ROBOFLOW_API_KEY;
    if (!url || !key) {
      throw new Error('ROBOFLOW_WORKFLOW_URL or ROBOFLOW_API_KEY not configured');
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        inputs: {
          image: { type: 'base64', value: imageBase64 },
          classes: 'solar-panel',
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`Roboflow API returned ${res.status}`);
    }
    return res.json();
  }

  async findAll(): Promise<AssetDto[]> {
    const deviceRows: any[] = await this.connection.query(`
      SELECT
        d.id,
        d."externalId",
        d."developerExternalId",
        d.latitude,
        d.longitude,
        d."createdAt",
        d."updatedAt",
        d."projectName",
        d.capacity,
        d."acCapacity",
        d."countryCode",
        d."operatingConfiguration",
        d."sourceAccessMode",
        d."evidence_pathway" AS "evidencePathway",
        d."ownership_status" AS "ownershipStatus",
        d."evident_device_id" AS "evidentDeviceId",
        d."evident_status" AS "evidentStatus",
        d."last_screen_status" AS "lastScreenStatus",
        d."last_screened_at" AS "lastScreenedAt",
        s.status,
        s.reviewer_name,
        s.submitted_at,
        CASE WHEN s.status IN ('approved', 'rejected') THEN s.updated_at ELSE NULL END AS closed_at,
        u.email AS submitter_email,
        COALESCE(NULLIF(TRIM(CONCAT(u."firstName", ' ', u."lastName")), ''), u.email) AS submitter_name
      FROM device d
      LEFT JOIN submissions s
        ON regexp_replace(lower(d."projectName"), '[^a-z0-9]+', '-', 'g')
         = regexp_replace(s.project_subfolder,
             '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
             '', 'i')
      LEFT JOIN public.user u ON u.api_user_id = d.api_user_id
      WHERE d."externalId" IS NOT NULL AND d."externalId" <> ''
      ORDER BY d."createdAt" DESC
    `);

    const docRows: any[] = await this.connection.query(
      `SELECT id, target_id, type, url, reviewed_flag FROM documents WHERE target_type = 'device'`,
    );

    // Group documents by device id
    const docsByDevice: Record<string, any[]> = {};
    for (const doc of docRows) {
      const key = String(doc.target_id);
      if (!docsByDevice[key]) docsByDevice[key] = [];
      docsByDevice[key].push(doc);
    }

    // Collect unique S3 keys and sign them
    const allKeys = [...new Set(docRows.map((d) => d.url).filter(Boolean))];
    const signedUrls: Record<string, string | null> = {};
    await Promise.all(
      allKeys.map(async (key) => {
        try {
          // DB stores URL-encoded keys (e.g. "Site%20Photo") but MinIO objects
          // use the decoded name ("Site Photo"). Decode before signing so the
          // presigned URL references the object that actually exists.
          signedUrls[key] = await this.fileService.getSignedUrl(
            decodeURIComponent(key),
            43200,
          );
        } catch {
          signedUrls[key] = null;
        }
      }),
    );

    // Map document DB types to frontend keys
    const typeToKey: Record<string, string> = {
      SINGLE_LINE_DIAGRAM: 'sld',
      FORM_SF_02: 'sf02',
      SF_02C: 'sf02c',
      COD_PROOF: 'codProof',
      METERING_EVIDENCE: 'meteringEvidence',
    };

    return deviceRows.map((r) => {
      const devDocs: any[] = docsByDevice[String(r.id)] ?? [];
      const byType = (t: string) => {
        const doc = devDocs.find((d) => d.type === t);
        return doc ? (signedUrls[doc.url] ?? null) : null;
      };
      const allOfType = (t: string) =>
        devDocs
          .filter((d) => d.type === t)
          .map((d) => signedUrls[d.url])
          .filter((u): u is string => !!u);

      // Build docMeta keyed the same way the frontend uses: 'sld', 'sf02', 'pic:0', etc.
      const docMeta: Record<string, DocMeta> = {};
      for (const doc of devDocs) {
        const key = typeToKey[doc.type];
        if (key) {
          docMeta[key] = { docId: doc.id, reviewed: !!doc.reviewed_flag };
        }
      }
      // Pictures: index-based keys
      const picDocs = devDocs.filter(
        (d) => d.type === 'PROJECT_PHOTOS' && signedUrls[d.url],
      );
      picDocs.forEach((doc, i) => {
        docMeta[`pic:${i}`] = { docId: doc.id, reviewed: !!doc.reviewed_flag };
      });
      // Screenshots: index-based keys
      const ssDocs = devDocs.filter(
        (d) => d.type === 'SCREENSHOTS' && signedUrls[d.url],
      );
      ssDocs.forEach((doc, i) => {
        docMeta[`ss:${i}`] = { docId: doc.id, reviewed: !!doc.reviewed_flag };
      });

      return {
        id: String(r.id),
        serial: r.externalId ?? r.developerExternalId ?? '',
        lat: r.latitude ? parseFloat(r.latitude) : null,
        long: r.longitude ? parseFloat(r.longitude) : null,
        projectName: r.projectName ?? '',
        capacity: r.capacity != null ? parseFloat(r.capacity) : null,
        acCapacity: r.acCapacity != null ? parseFloat(r.acCapacity) : null,
        countryCode: r.countryCode ?? '',
        submitterEmail: r.submitter_email ?? '',
        submitterName: r.submitter_name ?? '',
        reviewer: r.reviewer_name ?? '',
        dateAdded: r.createdAt ?? null,
        dateSubmitted: r.closed_at ?? null,
        modifiedDate: r.updatedAt ?? null,
        status: r.status ?? 'pending',
        notes: '',
        operatingConfiguration: r.operatingConfiguration ?? null,
        sourceAccessMode: r.sourceAccessMode ?? null,
        evidencePathway: r.evidencePathway ?? null,
        ownershipStatus: r.ownershipStatus ?? null,
        evidentDeviceId: r.evidentDeviceId ?? null,
        evidentStatus: r.evidentStatus ?? null,
        lastScreenStatus: r.lastScreenStatus ?? null,
        lastScreenedAt: r.lastScreenedAt ?? null,
        codProofUrl: byType('COD_PROOF'),
        sldUrl: byType('SINGLE_LINE_DIAGRAM'),
        sf02Url: byType('FORM_SF_02'),
        sf02cUrl: byType('SF_02C'),
        meteringEvidenceUrl: byType('METERING_EVIDENCE'),
        pictureUrls: allOfType('PROJECT_PHOTOS'),
        screenshotUrls: allOfType('SCREENSHOTS'),
        docMeta,
      };
    });
  }

  /**
   * D-REC §2.6: Screen a device for potential duplicates across all organizations.
   * Checks coordinate proximity (< 100m), cross-org serial number, and fingerprint.
   */
  async screenForDuplicates(deviceId: number): Promise<{
    duplicates: Array<{
      id: number;
      externalId: string;
      projectName: string;
      serialNumber: string;
      organizationId: number;
      matchType: string;
    }>;
  }> {
    const deviceRows: any[] = await this.connection.query(
      `SELECT id, latitude, longitude, "serialNumber", fingerprint
       FROM device WHERE id = $1`,
      [deviceId],
    );
    if (deviceRows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const device = deviceRows[0];
    const duplicates: Array<{
      id: number;
      externalId: string;
      projectName: string;
      serialNumber: string;
      organizationId: number;
      matchType: string;
    }> = [];

    // 1. Coordinate proximity (< 100m via Haversine)
    if (device.latitude && device.longitude) {
      const lat = parseFloat(device.latitude);
      const lng = parseFloat(device.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const nearby: any[] = await this.connection.query(
          `SELECT id, "externalId", "projectName", "serialNumber", "organizationId",
                  (6371000 * acos(LEAST(1, GREATEST(-1,
                    cos(radians($1)) * cos(radians(CAST(latitude AS double precision)))
                    * cos(radians(CAST(longitude AS double precision)) - radians($2))
                    + sin(radians($1)) * sin(radians(CAST(latitude AS double precision)))
                  )))) AS distance_m
           FROM device
           WHERE id != $3
             AND latitude IS NOT NULL
             AND longitude IS NOT NULL
           ORDER BY distance_m
           LIMIT 20`,
          [lat, lng, deviceId],
        );
        nearby
          .filter((r) => r.distance_m < 100)
          .forEach((d) =>
            duplicates.push({
              ...d,
              matchType: `coordinates (${Math.round(d.distance_m)}m)`,
            }),
          );
      }
    }

    // 2. Cross-org serial number
    if (device.serialNumber) {
      const serialMatches: any[] = await this.connection.query(
        `SELECT id, "externalId", "projectName", "serialNumber", "organizationId"
         FROM device
         WHERE "serialNumber" = $1 AND id != $2`,
        [device.serialNumber, deviceId],
      );
      serialMatches.forEach((d) => {
        if (!duplicates.find((dup) => dup.id === d.id)) {
          duplicates.push({ ...d, matchType: 'serial number' });
        }
      });
    }

    // 3. Fingerprint match
    if (device.fingerprint) {
      const fpMatches: any[] = await this.connection.query(
        `SELECT id, "externalId", "projectName", "serialNumber", "organizationId"
         FROM device
         WHERE fingerprint = $1 AND id != $2`,
        [device.fingerprint, deviceId],
      );
      fpMatches.forEach((d) => {
        if (!duplicates.find((dup) => dup.id === d.id)) {
          duplicates.push({ ...d, matchType: 'fingerprint' });
        }
      });
    }

    await this.logAudit(deviceId, 'duplicate_screening',
      `${duplicates.length} potential duplicate(s) found`,
      'reviewer', { duplicateCount: duplicates.length });

    return { duplicates };
  }

  /**
   * D-REC §2.7: Verify device ownership by checking required documents.
   * Sets ownershipStatus to 'verified' if SF-02C exists, otherwise 'flagged'.
   */
  async verifyOwnership(deviceId: number): Promise<{
    ownershipStatus: OwnershipStatus;
    missingDocuments: string[];
  }> {
    // Check which ownership-related documents exist
    const docs: Array<{ type: string }> = await this.connection.query(
      `SELECT DISTINCT type FROM documents
       WHERE target_type = 'device' AND target_id = $1
         AND type IN ('SF_02C', 'FORM_SF_02', 'INCORPORATION_CERTIFICATE')`,
      [deviceId],
    );
    const existingTypes = new Set(docs.map((d) => d.type));

    const missingDocuments: string[] = [];
    // SF-02C (Owner's Declaration / Proof of Ownership) is always required
    if (!existingTypes.has('SF_02C')) {
      missingDocuments.push('SF-02C (Owner\'s Declaration / Proof of Ownership)');
    }
    // SF-02 (Production Facility Registration) is always required
    if (!existingTypes.has('FORM_SF_02')) {
      missingDocuments.push('SF-02 (Production Facility Registration)');
    }

    const ownershipStatus =
      missingDocuments.length === 0
        ? OwnershipStatus.Verified
        : OwnershipStatus.Flagged;

    await this.connection.query(
      `UPDATE device SET ownership_status = $2 WHERE id = $1`,
      [deviceId, ownershipStatus],
    );

    this.logger.log(
      `Device ${deviceId} ownership: ${ownershipStatus}` +
        (missingDocuments.length > 0
          ? ` (missing: ${missingDocuments.join(', ')})`
          : ''),
    );
    await this.logAudit(deviceId, 'ownership_verification',
      `Ownership ${ownershipStatus}${missingDocuments.length ? ': missing ' + missingDocuments.join(', ') : ''}`,
      'system', { ownershipStatus, missingDocuments });

    return { ownershipStatus, missingDocuments };
  }

  async updateOwnershipStatus(
    deviceId: number,
    status: OwnershipStatus,
  ): Promise<{ ownershipStatus: OwnershipStatus }> {
    await this.connection.query(
      `UPDATE device SET ownership_status = $2 WHERE id = $1`,
      [deviceId, status],
    );
    return { ownershipStatus: status };
  }

  /**
   * D-REC §3.1: Classify a device into a formal evidence pathway and persist it.
   * The pathway is derived from operatingConfiguration + sourceAccessMode.
   */
  async classifyDevicePathway(deviceId: number): Promise<{
    evidencePathway: EvidencePathway | null;
    requirements: PathwayRequirements | null;
  }> {
    const rows: any[] = await this.connection.query(
      `SELECT "operatingConfiguration", "sourceAccessMode" FROM device WHERE id = $1`,
      [deviceId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const { operatingConfiguration, sourceAccessMode } = rows[0];
    const pathway = classifyEvidencePathway(
      operatingConfiguration as OperatingConfiguration,
      sourceAccessMode as SourceAccessMode,
    );

    // Persist the classification
    await this.connection.query(
      `UPDATE device SET evidence_pathway = $2 WHERE id = $1`,
      [deviceId, pathway],
    );

    const requirements = getPathwayRequirements(
      operatingConfiguration as OperatingConfiguration,
      sourceAccessMode as SourceAccessMode,
    );

    this.logger.log(
      `Device ${deviceId} classified as: ${pathway ?? 'unclassified'} ` +
        `(config=${operatingConfiguration}, mode=${sourceAccessMode})`,
    );
    await this.logAudit(deviceId, 'pathway_classification',
      `Classified as: ${pathway ?? 'unclassified'}`,
      'system', { pathway, operatingConfiguration, sourceAccessMode });

    return { evidencePathway: pathway, requirements };
  }

  /**
   * D-REC §3.3: Verify mode-specific requirements for a device's source-access mode.
   * Returns the rule set, which documents are present/missing, and which checks
   * the reviewer still needs to confirm manually.
   */
  async verifySourceAccessMode(deviceId: number): Promise<{
    mode: string | null;
    rules: ModeVerificationRule | null;
    missingRequired: string[];
    missingRecommended: string[];
    manualChecks: ModeCheck[];
    pathwayNote?: string;
  }> {
    const pathwayNote = await this.ensurePathwayClassified(deviceId);
    const deviceRows: any[] = await this.connection.query(
      `SELECT "sourceAccessMode" FROM device WHERE id = $1`,
      [deviceId],
    );
    if (deviceRows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const mode = deviceRows[0].sourceAccessMode as SourceAccessMode | null;
    const rules = getSourceAccessVerification(mode);
    if (!rules) {
      return {
        mode: mode ?? null,
        rules: null,
        missingRequired: [],
        missingRecommended: [],
        manualChecks: [],
      };
    }

    // Check which documents exist for this device
    const docs: Array<{ type: string }> = await this.connection.query(
      `SELECT DISTINCT type FROM documents
       WHERE target_type = 'device' AND target_id = $1`,
      [deviceId],
    );
    const existingTypes = new Set(docs.map((d) => d.type));

    const docLabel: Record<string, string> = {
      FORM_SF_02: 'SF-02 (Production Facility Registration)',
      SF_02C: 'SF-02C (Owner\'s Declaration)',
      METERING_EVIDENCE: 'Metering Evidence',
      SINGLE_LINE_DIAGRAM: 'Single Line Diagram',
      PROJECT_PHOTOS: 'Project Photos',
      SCREENSHOTS: 'Screenshots',
      COD_PROOF: 'COD Proof / Attestation',
    };

    const missingRequired = rules.requiredDocuments
      .filter((t) => !existingTypes.has(t))
      .map((t) => docLabel[t] || t);

    const missingRecommended = rules.recommendedDocuments
      .filter((t) => !existingTypes.has(t))
      .map((t) => docLabel[t] || t);

    this.logger.log(
      `Device ${deviceId} source-access verification (${mode}): ` +
        `${missingRequired.length} required missing, ${missingRecommended.length} recommended missing`,
    );

    return {
      mode,
      rules,
      missingRequired,
      missingRecommended,
      manualChecks: rules.checks,
      ...(pathwayNote ? { pathwayNote } : {}),
    };
  }

  /**
   * D-REC §3.7: Historical consistency review for production data.
   * Analyses meter readings over time and flags anomalies.
   */
  async reviewHistoricalConsistency(deviceId: number): Promise<{
    totalReadings: number;
    periodMonths: number;
    anomalies: Array<{
      type: string;
      severity: 'warning' | 'critical';
      description: string;
      readingIds?: number[];
    }>;
    summary: {
      meanKwh: number;
      stdDevKwh: number;
      coefficientOfVariation: number;
      minKwh: number;
      maxKwh: number;
    } | null;
    pathwayNote?: string;
  }> {
    const pathwayNote = await this.ensurePathwayClassified(deviceId);
    // Get device externalId
    const deviceRows: any[] = await this.connection.query(
      `SELECT "externalId" FROM device WHERE id = $1`,
      [deviceId],
    );
    if (deviceRows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const externalId = deviceRows[0].externalId;

    // Fetch all readings ordered chronologically
    const reads: Array<{
      id: number;
      value: number;
      unit: string;
      start_date: Date;
      end_date: Date;
    }> = await this.connection.query(
      `SELECT id, value, unit, start_date, end_date
       FROM meter_reads
       WHERE external_id = $1
       ORDER BY end_date ASC`,
      [externalId],
    );

    if (reads.length === 0) {
      return {
        totalReadings: 0,
        periodMonths: 0,
        anomalies: [],
        summary: null,
      };
    }

    // Normalize all values to kWh
    const normalized = reads.map((r) => {
      let kwh = r.value;
      if (r.unit === 'Wh') kwh /= 1000;
      else if (r.unit === 'MWh') kwh *= 1000;
      else if (r.unit === 'GWh') kwh *= 1000000;
      return { ...r, kwh };
    });

    const firstDate = new Date(normalized[0].start_date);
    const lastDate = new Date(normalized[normalized.length - 1].end_date);
    const periodMonths = Math.max(
      1,
      Math.round(
        (lastDate.getTime() - firstDate.getTime()) / (30.44 * 86400000),
      ),
    );

    const anomalies: Array<{
      type: string;
      severity: 'warning' | 'critical';
      description: string;
      readingIds?: number[];
    }> = [];

    // 1. Negative values
    const negatives = normalized.filter((r) => r.kwh < 0);
    if (negatives.length > 0) {
      anomalies.push({
        type: 'negative_value',
        severity: 'critical',
        description: `${negatives.length} reading(s) with negative values`,
        readingIds: negatives.map((r) => r.id),
      });
    }

    // 2. Flat-line detection — 3+ consecutive identical non-zero values
    let flatRunStart = 0;
    for (let i = 1; i < normalized.length; i++) {
      if (
        normalized[i].kwh === normalized[flatRunStart].kwh &&
        normalized[i].kwh > 0
      ) {
        if (i - flatRunStart >= 2) {
          const run = normalized.slice(flatRunStart, i + 1);
          anomalies.push({
            type: 'flat_line',
            severity: 'warning',
            description: `${run.length} consecutive identical readings (${run[0].kwh.toFixed(1)} kWh) — possible stuck meter`,
            readingIds: run.map((r) => r.id),
          });
          flatRunStart = i + 1;
        }
      } else {
        flatRunStart = i;
      }
    }

    // 3. Zero-production gaps (consecutive zero readings)
    const zeroRuns: number[][] = [];
    let zeroStart = -1;
    for (let i = 0; i < normalized.length; i++) {
      if (normalized[i].kwh === 0) {
        if (zeroStart === -1) zeroStart = i;
      } else {
        if (zeroStart !== -1 && i - zeroStart >= 3) {
          zeroRuns.push(
            normalized.slice(zeroStart, i).map((r) => r.id),
          );
        }
        zeroStart = -1;
      }
    }
    if (
      zeroStart !== -1 &&
      normalized.length - zeroStart >= 3
    ) {
      zeroRuns.push(
        normalized.slice(zeroStart).map((r) => r.id),
      );
    }
    for (const run of zeroRuns) {
      anomalies.push({
        type: 'zero_gap',
        severity: 'warning',
        description: `${run.length} consecutive zero-production readings`,
        readingIds: run,
      });
    }

    // 4. Spike detection — readings > 3× rolling average (window of 5)
    const windowSize = 5;
    if (normalized.length > windowSize) {
      for (let i = windowSize; i < normalized.length; i++) {
        const window = normalized.slice(i - windowSize, i);
        const avg =
          window.reduce((s, r) => s + r.kwh, 0) / windowSize;
        if (avg > 0 && normalized[i].kwh > avg * 3) {
          anomalies.push({
            type: 'spike',
            severity: 'critical',
            description: `Reading ${normalized[i].kwh.toFixed(1)} kWh is ${(normalized[i].kwh / avg).toFixed(1)}× the rolling average (${avg.toFixed(1)} kWh)`,
            readingIds: [normalized[i].id],
          });
        }
      }
    }

    // 5. Summary statistics
    const values = normalized.map((r) => r.kwh).filter((v) => v >= 0);
    let summary = null;
    if (values.length > 0) {
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const variance =
        values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 0;

      summary = {
        meanKwh: Math.round(mean * 100) / 100,
        stdDevKwh: Math.round(stdDev * 100) / 100,
        coefficientOfVariation: Math.round(cv * 1000) / 1000,
        minKwh: Math.round(Math.min(...values) * 100) / 100,
        maxKwh: Math.round(Math.max(...values) * 100) / 100,
      };

      // Flag excessive variance (CV > 1.5 is unusual for solar)
      if (cv > 1.5 && values.length >= 5) {
        anomalies.push({
          type: 'high_variance',
          severity: 'warning',
          description: `Coefficient of variation is ${cv.toFixed(2)} (typical solar < 1.0) — readings are unusually inconsistent`,
        });
      }

      // 6. ±1.5σ anomaly band — flag readings that are atypical but not impossible
      if (stdDev > 0 && values.length >= 10) {
        const loBand = mean - 1.5 * stdDev;
        const hiBand = mean + 1.5 * stdDev;
        const outliers = normalized.filter(
          (r) => r.kwh >= 0 && (r.kwh < loBand || r.kwh > hiBand),
        );
        if (outliers.length > 0) {
          anomalies.push({
            type: 'sigma_band',
            severity: 'warning',
            description: `${outliers.length} reading(s) outside ±1.5σ band [${loBand.toFixed(1)}–${hiBand.toFixed(1)} kWh] — atypical but not necessarily invalid`,
            readingIds: outliers.map((r) => r.id),
          });
        }
        summary['sigmaBand'] = {
          low: Math.round(loBand * 100) / 100,
          high: Math.round(hiBand * 100) / 100,
          outliersCount: outliers.length,
        };
      }
    }

    this.logger.log(
      `Device ${deviceId} historical consistency: ${reads.length} readings, ` +
        `${periodMonths} months, ${anomalies.length} anomalies`,
    );

    await this.logAudit(deviceId, 'historical_consistency',
      `${reads.length} readings, ${anomalies.length} anomalies over ${periodMonths} months`,
      'reviewer', { totalReadings: reads.length, anomalyCount: anomalies.length });

    return {
      totalReadings: reads.length,
      periodMonths,
      anomalies,
      summary,
      ...(pathwayNote ? { pathwayNote } : {}),
    };
  }

  /**
   * D-REC §3.6: Irradiance-based production ceiling check.
   * Estimates expected yield from device location, compares with
   * the configured yieldValue, and checks recent readings against the ceiling.
   */
  async checkProductionCeiling(deviceId: number): Promise<{
    irradiance: IrradianceEstimate | null;
    configuredYield: number;
    capacityKw: number;
    yieldMismatch: boolean;
    recentReadings: Array<{
      startDate: string;
      endDate: string;
      valueKwh: number;
      periodHours: number;
      ceilingKwh: number;
      exceedsCeiling: boolean;
    }>;
    pathwayNote?: string;
  }> {
    const pathwayNote = await this.ensurePathwayClassified(deviceId);
    const rows: any[] = await this.connection.query(
      `SELECT id, latitude, longitude, capacity, "yieldValue", "commissioningDate"
       FROM device WHERE id = $1`,
      [deviceId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const device = rows[0];
    const lat = device.latitude ? parseFloat(device.latitude) : null;
    const lng = device.longitude ? parseFloat(device.longitude) : null;
    const capacityKw = device.capacity ? parseFloat(device.capacity) : 0;
    const configuredYield = device.yieldValue || 2000;

    // Estimate irradiance from location
    let irradiance: IrradianceEstimate | null = null;
    let yieldMismatch = false;
    if (lat !== null && !isNaN(lat) && capacityKw > 0) {
      irradiance = estimateIrradiance(lat, capacityKw);
      // Flag if the configured yield exceeds the location-based optimistic estimate
      // with a 10% tolerance to account for coarse irradiance bands and the default yieldValue of 2000
      yieldMismatch = configuredYield > irradiance.yieldHigh * 1.1;
    }

    // Check recent meter readings against the ceiling
    const readRows: any[] = await this.connection.query(
      `SELECT start_date AS "startDate", end_date AS "endDate", value, unit
       FROM meter_reads
       WHERE external_id = (SELECT "externalId" FROM device WHERE id = $1)
       ORDER BY end_date DESC
       LIMIT 12`,
      [deviceId],
    );

    const ceilingYield = irradiance?.yieldHigh ?? configuredYield;
    const recentReadings = readRows.map((r: any) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const periodHours = Math.abs(end.getTime() - start.getTime()) / 3600000;

      // Convert value to kWh based on unit
      let valueKwh = parseFloat(r.value);
      if (r.unit === 'Wh') valueKwh /= 1000;
      else if (r.unit === 'MWh') valueKwh *= 1000;
      else if (r.unit === 'GWh') valueKwh *= 1000000;

      // Ceiling for this period: capacity × hourly yield rate × period × 1.2 margin
      const ceilingKwh =
        capacityKw * (ceilingYield / 8760) * periodHours * 1.2;

      return {
        startDate: r.startDate,
        endDate: r.endDate,
        valueKwh: Math.round(valueKwh * 100) / 100,
        periodHours: Math.round(periodHours * 10) / 10,
        ceilingKwh: Math.round(ceilingKwh * 100) / 100,
        exceedsCeiling: valueKwh > ceilingKwh,
      };
    });

    this.logger.log(
      `Device ${deviceId} ceiling check: configured=${configuredYield}, ` +
        `irradiance=${irradiance?.yieldHigh ?? 'N/A'}, ` +
        `mismatch=${yieldMismatch}, ` +
        `${recentReadings.filter((r) => r.exceedsCeiling).length}/${recentReadings.length} readings exceed ceiling`,
    );

    const parts: string[] = [];
    if (yieldMismatch) {
      parts.push(`Configured yield ${configuredYield} exceeds location estimate ${irradiance?.yieldHigh} kWh/kW/yr`);
    } else {
      parts.push(`Configured yield ${configuredYield} is within expected range for location`);
    }
    await this.logAudit(deviceId, 'ceiling_check',
      parts.join('. '),
      'reviewer', { configuredYield, irradianceYield: irradiance?.yieldHigh, yieldMismatch });

    return {
      irradiance,
      configuredYield,
      capacityKw,
      yieldMismatch,
      recentReadings,
      ...(pathwayNote ? { pathwayNote } : {}),
    };
  }

  /**
   * D-REC §3.9: Evaluate compensating controls for Mode 4 devices.
   * Runs all required checks and returns pass/fail for each.
   */
  async evaluateCompensatingControls(
    deviceId: number,
  ): Promise<CompensatingControlsEvaluation & { pathwayNote?: string }> {
    const pathwayNote = await this.ensurePathwayClassified(deviceId);
    // Get device info
    const rows: any[] = await this.connection.query(
      `SELECT "sourceAccessMode", latitude, capacity FROM device WHERE id = $1`,
      [deviceId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const mode = rows[0].sourceAccessMode as SourceAccessMode | null;
    const isMode4 = requiresCompensatingControls(mode);

    if (!isMode4) {
      return { isMode4: false, allSatisfied: true, controls: [] };
    }

    const controls: CompensatingControlResult[] = [];

    // Control 1: All Mode 4 required documents present
    const docs: Array<{ type: string }> = await this.connection.query(
      `SELECT DISTINCT type FROM documents
       WHERE target_type = 'device' AND target_id = $1`,
      [deviceId],
    );
    const existingTypes = new Set(docs.map((d) => d.type));
    const mode4Required = ['METERING_EVIDENCE', 'SCREENSHOTS', 'FORM_SF_02', 'SF_02C', 'COD_PROOF'];
    const missingDocs = mode4Required.filter((t) => !existingTypes.has(t));
    controls.push({
      id: 'required_documents',
      label: 'All required documents uploaded',
      satisfied: missingDocs.length === 0,
      detail: missingDocs.length === 0
        ? 'All 5 required document types are present'
        : `Missing: ${missingDocs.join(', ')}`,
    });

    // Control 2: COD / third-party attestation specifically verified
    const hasCod = existingTypes.has('COD_PROOF');
    controls.push({
      id: 'cod_attestation',
      label: 'COD proof / third-party attestation',
      satisfied: hasCod,
      detail: hasCod
        ? 'COD proof document is present'
        : 'COD proof or equivalent attestation is required for Mode 4',
    });

    // Control 3: No ceiling exceedances (stricter — no margin tolerance)
    let ceilingOk = true;
    let ceilingDetail = 'No meter readings to check';
    try {
      const ceilingResult = await this.checkProductionCeiling(deviceId);
      const exceedCount = ceilingResult.recentReadings.filter(
        (r: any) => r.exceedsCeiling,
      ).length;
      if (ceilingResult.recentReadings.length > 0) {
        ceilingOk = exceedCount === 0 && !ceilingResult.yieldMismatch;
        ceilingDetail = ceilingOk
          ? `${ceilingResult.recentReadings.length} readings all within ceiling`
          : `${exceedCount} reading(s) exceed ceiling${ceilingResult.yieldMismatch ? ', yield mismatch detected' : ''}`;
      }
    } catch {
      ceilingDetail = 'Could not run ceiling check';
      ceilingOk = false;
    }
    controls.push({
      id: 'production_ceiling',
      label: 'Production within irradiance ceiling',
      satisfied: ceilingOk,
      detail: ceilingDetail,
    });

    // Control 4: No critical anomalies in historical data
    let consistencyOk = true;
    let consistencyDetail = 'No meter readings to check';
    try {
      const consistency = await this.reviewHistoricalConsistency(deviceId);
      const criticalCount = consistency.anomalies.filter(
        (a: any) => a.severity === 'critical',
      ).length;
      if (consistency.totalReadings > 0) {
        consistencyOk = criticalCount === 0;
        consistencyDetail = consistencyOk
          ? `${consistency.totalReadings} readings, no critical anomalies`
          : `${criticalCount} critical anomaly(ies) found`;
      }
    } catch {
      consistencyDetail = 'Could not run consistency check';
      consistencyOk = false;
    }
    controls.push({
      id: 'historical_consistency',
      label: 'No critical anomalies in production history',
      satisfied: consistencyOk,
      detail: consistencyDetail,
    });

    // Control 5: Ownership verified
    const ownershipRows: any[] = await this.connection.query(
      `SELECT ownership_status FROM device WHERE id = $1`,
      [deviceId],
    );
    const ownershipStatus = ownershipRows[0]?.ownership_status;
    controls.push({
      id: 'ownership_verified',
      label: 'Ownership verification complete',
      satisfied: ownershipStatus === 'verified',
      detail: ownershipStatus === 'verified'
        ? 'Device ownership has been verified'
        : `Ownership status is "${ownershipStatus || 'unverified'}"`,
    });

    const allSatisfied = controls.every((c) => c.satisfied);

    await this.logAudit(deviceId, 'compensating_controls',
      `Mode 4 evaluation: ${allSatisfied ? 'all satisfied' : controls.filter((c) => !c.satisfied).length + ' control(s) failed'}`,
      'system', { controls: controls.map((c) => ({ id: c.id, satisfied: c.satisfied })) });

    return { isMode4: true, allSatisfied, controls, ...(pathwayNote ? { pathwayNote } : {}) };
  }

  /**
   * D-REC §3.10: Cross-source verification.
   *
   * Compares actual meter readings against irradiance-modeled monthly
   * production, computing a regression-based Performance Factor.
   */
  async crossSourceVerification(deviceId: number): Promise<CrossSourceResult & { pathwayNote?: string }> {
    const pathwayNote = await this.ensurePathwayClassified(deviceId);
    // Fetch device
    const rows: any[] = await this.connection.query(
      `SELECT id, latitude, longitude, capacity, "yieldValue", "externalId"
       FROM device WHERE id = $1`,
      [deviceId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const device = rows[0];
    const lat = device.latitude ? parseFloat(device.latitude) : null;
    const capacityKw = device.capacity ? parseFloat(device.capacity) : 0;
    const externalId = device.externalId;

    if (lat === null || isNaN(lat) || capacityKw <= 0) {
      return computeCrossSourceVerification([]);
    }

    // Modeled annual yield from irradiance
    const irr = estimateIrradiance(lat, capacityKw);
    // Use midpoint between yieldHigh and yieldLow for expected
    const expectedAnnualKwhPerKw = (irr.yieldHigh + irr.yieldLow) / 2;

    // Monthly distribution weights based on latitude
    // Equatorial: roughly flat; higher latitudes: summer-heavy
    const monthWeights = this.monthlyDistribution(lat);

    // Fetch all meter readings
    const reads: any[] = await this.connection.query(
      `SELECT value, unit, start_date, end_date
       FROM meter_reads
       WHERE external_id = $1
       ORDER BY end_date ASC`,
      [externalId],
    );

    if (reads.length === 0) {
      return computeCrossSourceVerification([]);
    }

    // Bucket actual readings by YYYY-MM (using midpoint of period)
    const actualByMonth = new Map<string, number>();
    for (const r of reads) {
      const start = new Date(r.start_date);
      const end = new Date(r.end_date);
      const mid = new Date((start.getTime() + end.getTime()) / 2);
      const key = `${mid.getFullYear()}-${String(mid.getMonth() + 1).padStart(2, '0')}`;

      let kwh = parseFloat(r.value);
      if (r.unit === 'Wh') kwh /= 1000;
      else if (r.unit === 'MWh') kwh *= 1000;

      actualByMonth.set(key, (actualByMonth.get(key) ?? 0) + kwh);
    }

    // Build comparison array — one entry per month that has actual data
    const months: MonthlyComparison[] = [];
    for (const [monthKey, actualKwh] of actualByMonth) {
      const monthIdx = parseInt(monthKey.split('-')[1], 10) - 1; // 0-based
      const modelKwh =
        capacityKw * expectedAnnualKwhPerKw * monthWeights[monthIdx];

      months.push({
        month: monthKey,
        actualKwh: Math.round(actualKwh * 100) / 100,
        modelKwh: Math.round(modelKwh * 100) / 100,
        ratio: 0, // filled by computeCrossSourceVerification
      });
    }

    // Sort chronologically
    months.sort((a, b) => a.month.localeCompare(b.month));

    const result = computeCrossSourceVerification(months);

    await this.logAudit(
      deviceId,
      'cross_source_verification',
      `PF=${result.performanceFactor}, R²=${result.rSquared}, ${result.monthsCompared} months, ${result.flags.length} flag(s)`,
      'system',
      {
        performanceFactor: result.performanceFactor,
        simpleRatio: result.simpleRatio,
        rSquared: result.rSquared,
        monthsCompared: result.monthsCompared,
        flagCount: result.flags.length,
      },
    );

    return { ...result, ...(pathwayNote ? { pathwayNote } : {}) };
  }

  /**
   * Generate monthly distribution weights (sum = 1.0) accounting for
   * latitude-dependent seasonal variation.
   *
   * Near equator: flat ~0.083/month.
   * Higher latitudes: peak in local summer, trough in winter.
   */
  private monthlyDistribution(latitude: number): number[] {
    const absLat = Math.abs(latitude);
    // Seasonality amplitude: 0 at equator, up to 0.6 at lat 60+
    const amplitude = Math.min(0.6, absLat / 100);

    // Northern hemisphere peaks around June (month 5, 0-indexed)
    // Southern hemisphere peaks around December (month 11)
    const peakMonth = latitude >= 0 ? 5 : 11;

    const raw: number[] = [];
    for (let m = 0; m < 12; m++) {
      // Cosine-based seasonal curve
      const offset = ((m - peakMonth + 12) % 12) / 12;
      raw.push(1 + amplitude * Math.cos(2 * Math.PI * offset));
    }

    const sum = raw.reduce((a, b) => a + b, 0);
    return raw.map((v) => v / sum);
  }

  // ── Meter-Read Reviews ───────────────────────────────────────────────

  async findAllMeterReadReviews(): Promise<any[]> {
    const rows = await this.connection.query(`
      SELECT
        d.id                          AS "deviceId",
        d."externalId"                AS "externalId",
        d."projectName"               AS "projectName",
        d.serial_number               AS "serialNumber",
        d.capacity                    AS "capacity",
        d."countryCode"               AS "countryCode",
        d.latitude                    AS "lat",
        d.longitude                   AS "long",
        u.email                       AS "submitterEmail",
        COALESCE(mrr.status, 'pending') AS "reviewStatus",
        mrr.reviewer                  AS "reviewer",
        mrr.notes                     AS "notes",
        COUNT(mr.id)::int             AS "readCount",
        MAX(mr.end_date)              AS "latestReadDate",
        MIN(mr.start_date)            AS "earliestReadDate",
        ROUND(SUM(mr.value)::numeric / 1000, 2)  AS "totalKwh"
      FROM device d
      INNER JOIN meter_reads mr ON mr.external_id = d."externalId"
      LEFT JOIN meter_read_reviews mrr ON mrr.device_id = d.id
      LEFT JOIN public.user u ON u.id = d."organizationId"
      GROUP BY d.id, d."externalId", d."projectName", d.serial_number,
               d.capacity, d."countryCode", d.latitude, d.longitude,
               u.email, mrr.status, mrr.reviewer, mrr.notes
      HAVING COUNT(mr.id) > 0
      ORDER BY MAX(mr.end_date) DESC
    `);
    return rows;
  }

  async findMeterReadsForDevice(deviceId: number): Promise<any[]> {
    const rows = await this.connection.query(`
      SELECT mr.id, mr.value, mr.unit, mr.type,
             mr.start_date AS "startDate",
             mr.end_date   AS "endDate",
             mr.certified
      FROM meter_reads mr
      INNER JOIN device d ON d."externalId" = mr.external_id
      WHERE d.id = $1
      ORDER BY mr.end_date DESC
    `, [deviceId]);
    return rows;
  }

  async updateMeterReadReviewStatus(
    deviceId: number,
    status: string,
    notes?: string,
    reviewer?: string,
    ip?: string,
  ): Promise<{ status: string }> {
    await this.connection.query(
      `INSERT INTO meter_read_reviews (device_id, status, reviewer, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (device_id) DO UPDATE
       SET status = $2, reviewer = $3, notes = $4, updated_at = now()`,
      [deviceId, status, reviewer || null, notes || null],
    );

    await this.connection.query(
      `INSERT INTO audit_log (device_id, action_type, detail, performed_by, metadata)
       VALUES ($1, 'meter_read_review_status', $2, $3, $4)`,
      [
        deviceId,
        `Meter-read review status set to ${status}`,
        reviewer || 'system',
        JSON.stringify({ status, ip }),
      ],
    );

    return { status };
  }

  async bulkUpdateMeterReadReviewStatus(
    deviceIds: number[],
    status: string,
    reviewer?: string,
    ip?: string,
  ): Promise<Array<{ deviceId: number; status: string; error?: string }>> {
    const results: Array<{ deviceId: number; status: string; error?: string }> = [];
    for (const id of deviceIds) {
      try {
        const res = await this.updateMeterReadReviewStatus(id, status, undefined, reviewer, ip);
        results.push({ deviceId: id, status: res.status });
      } catch (err: any) {
        results.push({ deviceId: id, status: 'error', error: err.message });
      }
    }
    const succeeded = results.filter((r) => r.status !== 'error').map((r) => r.deviceId);
    for (const id of succeeded) {
      await this.logAudit(
        id,
        'bulk_status_change',
        `Bulk meter-read review status change to "${status}" (${deviceIds.length} devices in batch)`,
        reviewer || 'reviewer',
        { batchSize: deviceIds.length, targetStatus: status, context: 'meter_reads' },
        ip,
      );
    }
    return results;
  }

  async flagMeterRead(
    deviceId: number,
    readId: number,
    reason: string,
    reviewer?: string,
    ip?: string,
  ): Promise<{ logged: boolean }> {
    // Verify the read belongs to this device
    const rows: any[] = await this.connection.query(
      `SELECT mr.id, mr.value, mr.start_date, mr.end_date
       FROM meter_reads mr
       INNER JOIN device d ON d."externalId" = mr.external_id
       WHERE d.id = $1 AND mr.id = $2`,
      [deviceId, readId],
    );
    if (!rows.length) {
      throw new Error(`Read ${readId} not found for device ${deviceId}`);
    }
    const read = rows[0];
    await this.logAudit(
      deviceId,
      'read_anomaly_flagged',
      `Read #${readId} flagged: ${reason}`,
      reviewer || 'reviewer',
      {
        readId,
        value: read.value,
        startDate: read.start_date,
        endDate: read.end_date,
        reason,
      },
      ip,
    );
    return { logged: true };
  }

  async meterReadGapAnalysis(
    deviceId: number,
    ip?: string,
  ): Promise<{
    totalReads: number;
    gaps: Array<{ after: string; before: string; gapDays: number }>;
    coveragePercent: number;
    firstRead: string | null;
    lastRead: string | null;
    expectedPeriodDays: number | null;
  }> {
    const rows: any[] = await this.connection.query(
      `SELECT mr.start_date, mr.end_date
       FROM meter_reads mr
       INNER JOIN device d ON d."externalId" = mr.external_id
       WHERE d.id = $1
       ORDER BY mr.end_date ASC`,
      [deviceId],
    );

    if (!rows.length) {
      return { totalReads: 0, gaps: [], coveragePercent: 0, firstRead: null, lastRead: null, expectedPeriodDays: null };
    }

    // Estimate expected period from median gap between consecutive reads
    const intervals: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      const prev = new Date(rows[i - 1].end_date).getTime();
      const curr = new Date(rows[i].start_date).getTime();
      intervals.push((curr - prev) / (1000 * 60 * 60 * 24));
    }
    intervals.sort((a, b) => a - b);
    const medianDays = intervals.length > 0 ? intervals[Math.floor(intervals.length / 2)] : null;
    // A gap is anything > 2x the median interval (or > 45 days if < 3 reads)
    const threshold = medianDays !== null && intervals.length >= 3 ? medianDays * 2 : 45;

    const gaps: Array<{ after: string; before: string; gapDays: number }> = [];
    for (let i = 1; i < rows.length; i++) {
      const prevEnd = new Date(rows[i - 1].end_date);
      const currStart = new Date(rows[i].start_date);
      const gapDays = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24);
      if (gapDays > threshold) {
        gaps.push({
          after: rows[i - 1].end_date,
          before: rows[i].start_date,
          gapDays: Math.round(gapDays),
        });
      }
    }

    const firstDate = new Date(rows[0].start_date).getTime();
    const lastDate = new Date(rows[rows.length - 1].end_date).getTime();
    const totalSpanDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    const coveredDays = rows.reduce((sum: number, r: any) => {
      return sum + (new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    const coveragePercent = totalSpanDays > 0 ? Math.round((coveredDays / totalSpanDays) * 100) : 100;

    await this.logAudit(
      deviceId,
      'read_gap_analysis',
      `Gap analysis: ${rows.length} reads, ${gaps.length} gap(s), ${coveragePercent}% coverage`,
      'system',
      { totalReads: rows.length, gapCount: gaps.length, coveragePercent },
      ip,
    );

    return {
      totalReads: rows.length,
      gaps,
      coveragePercent,
      firstRead: rows[0].start_date,
      lastRead: rows[rows.length - 1].end_date,
      expectedPeriodDays: medianDays !== null ? Math.round(medianDays) : null,
    };
  }

  /**
   * D-REC §VA: Photo/GPS EXIF verification.
   * Downloads PROJECT_PHOTOS from S3, extracts GPS coordinates from EXIF,
   * and checks each photo is within 300m of the device's declared location.
   */
  async verifyPhotoGps(deviceId: number): Promise<{
    deviceLat: number | null;
    deviceLng: number | null;
    photos: Array<{
      docId: number;
      fileName: string;
      hasGps: boolean;
      lat: number | null;
      lng: number | null;
      distanceMeters: number | null;
      withinThreshold: boolean | null;
    }>;
    thresholdMeters: number;
    summary: { total: number; withGps: number; withinThreshold: number; flagged: number };
  }> {
    const THRESHOLD_M = 300;

    // Get device coordinates
    const deviceRows: any[] = await this.connection.query(
      `SELECT latitude, longitude FROM device WHERE id = $1`,
      [deviceId],
    );
    if (deviceRows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const deviceLat = deviceRows[0].latitude != null ? parseFloat(deviceRows[0].latitude) : null;
    const deviceLng = deviceRows[0].longitude != null ? parseFloat(deviceRows[0].longitude) : null;

    // Get PROJECT_PHOTOS documents
    const docs: Array<{ id: number; url: string }> = await this.connection.query(
      `SELECT id, url FROM documents
       WHERE target_id = $1 AND target_type = 'device' AND type = 'PROJECT_PHOTOS'`,
      [deviceId],
    );

    const photos: Array<{
      docId: number;
      fileName: string;
      hasGps: boolean;
      lat: number | null;
      lng: number | null;
      distanceMeters: number | null;
      withinThreshold: boolean | null;
    }> = [];

    for (const doc of docs) {
      const fileName = doc.url.split('/').pop() || doc.url;
      try {
        const s3Result = await this.fileService.getUploadS3(doc.url);
        const buffer: Buffer = s3Result.data?.Body;
        if (!buffer) {
          photos.push({ docId: doc.id, fileName, hasGps: false, lat: null, lng: null, distanceMeters: null, withinThreshold: null });
          continue;
        }

        const gps = await exifr.gps(buffer).catch(() => null);
        if (!gps || gps.latitude == null || gps.longitude == null) {
          photos.push({ docId: doc.id, fileName, hasGps: false, lat: null, lng: null, distanceMeters: null, withinThreshold: null });
          continue;
        }

        let distanceMeters: number | null = null;
        let withinThreshold: boolean | null = null;
        if (deviceLat != null && deviceLng != null) {
          distanceMeters = Math.round(haversineMeters(deviceLat, deviceLng, gps.latitude, gps.longitude));
          withinThreshold = distanceMeters <= THRESHOLD_M;
        }

        photos.push({
          docId: doc.id,
          fileName,
          hasGps: true,
          lat: Math.round(gps.latitude * 1e6) / 1e6,
          lng: Math.round(gps.longitude * 1e6) / 1e6,
          distanceMeters,
          withinThreshold,
        });
      } catch (err) {
        this.logger.warn(`EXIF extraction failed for doc ${doc.id}: ${err.message}`);
        photos.push({ docId: doc.id, fileName, hasGps: false, lat: null, lng: null, distanceMeters: null, withinThreshold: null });
      }
    }

    const withGps = photos.filter((p) => p.hasGps).length;
    const withinCount = photos.filter((p) => p.withinThreshold === true).length;
    const flagged = photos.filter((p) => p.withinThreshold === false).length;

    await this.logAudit(deviceId, 'photo_gps_check',
      `${photos.length} photos: ${withGps} with GPS, ${withinCount} within ${THRESHOLD_M}m, ${flagged} flagged`,
      'reviewer', { thresholdMeters: THRESHOLD_M, total: photos.length, withGps, withinCount, flagged });

    return {
      deviceLat,
      deviceLng,
      photos,
      thresholdMeters: THRESHOLD_M,
      summary: { total: photos.length, withGps, withinThreshold: withinCount, flagged },
    };
  }

  /**
   * D-REC VA layer: Auto-Screen Report.
   * Runs all verification checks in parallel and aggregates results
   * into a single screening report with pass/warn/fail flags.
   */
  async autoScreenReport(deviceId: number): Promise<{
    deviceId: number;
    sections: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail' | 'skip';
      flags: string[];
      detail?: any;
    }>;
    overallStatus: 'pass' | 'warn' | 'fail';
    timestamp: string;
  }> {
    const sections: Array<{
      name: string;
      status: 'pass' | 'warn' | 'fail' | 'skip';
      flags: string[];
      detail?: any;
    }> = [];

    // Run all checks in parallel, catching individual failures
    const [
      ownership,
      duplicates,
      sourceAccess,
      consistency,
      ceiling,
      crossSource,
      photoGps,
      controls,
      sldCompare,
    ] = await Promise.allSettled([
      this.verifyOwnership(deviceId),
      this.screenForDuplicates(deviceId),
      this.verifySourceAccessMode(deviceId),
      this.reviewHistoricalConsistency(deviceId),
      this.checkProductionCeiling(deviceId),
      this.crossSourceVerification(deviceId),
      this.verifyPhotoGps(deviceId),
      this.evaluateCompensatingControls(deviceId),
      this.compareSldCapacity(deviceId),
    ]);

    // 1. Ownership
    if (ownership.status === 'fulfilled') {
      const r = ownership.value;
      const flags: string[] = [];
      if (r.ownershipStatus === 'flagged') flags.push('Ownership flagged');
      if (r.missingDocuments?.length > 0)
        flags.push(`Missing: ${r.missingDocuments.join(', ')}`);
      sections.push({
        name: 'Ownership Verification',
        status: flags.length === 0 ? 'pass' : 'warn',
        flags,
      });
    } else {
      sections.push({ name: 'Ownership Verification', status: 'skip', flags: ['Check failed'] });
    }

    // 2. Duplicates
    if (duplicates.status === 'fulfilled') {
      const r = duplicates.value;
      const count = r.duplicates?.length ?? 0;
      sections.push({
        name: 'Duplicate Screening',
        status: count === 0 ? 'pass' : 'fail',
        flags: count > 0 ? [`${count} potential duplicate(s) found`] : [],
      });
    } else {
      sections.push({ name: 'Duplicate Screening', status: 'skip', flags: ['Check failed'] });
    }

    // 3. Source Access
    if (sourceAccess.status === 'fulfilled') {
      const r = sourceAccess.value;
      const flags: string[] = [];
      if (r.missingRequired?.length > 0)
        flags.push(`Missing required docs: ${r.missingRequired.join(', ')}`);
      if (r.manualChecks?.length > 0)
        flags.push(`${r.manualChecks.length} manual check(s) needed`);
      sections.push({
        name: 'Source Access Mode',
        status: r.missingRequired?.length > 0 ? 'fail' : flags.length > 0 ? 'warn' : 'pass',
        flags,
      });
    } else {
      sections.push({ name: 'Source Access Mode', status: 'skip', flags: ['Check failed'] });
    }

    // 4. Historical Consistency
    if (consistency.status === 'fulfilled') {
      const r = consistency.value;
      const criticals = r.anomalies.filter((a) => a.severity === 'critical');
      const warnings = r.anomalies.filter((a) => a.severity === 'warning');
      const flags: string[] = [];
      if (criticals.length > 0) flags.push(`${criticals.length} critical anomaly(s)`);
      if (warnings.length > 0) flags.push(`${warnings.length} warning(s)`);
      sections.push({
        name: 'Historical Consistency',
        status: criticals.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass',
        flags,
        detail: { totalReadings: r.totalReadings, periodMonths: r.periodMonths },
      });
    } else {
      sections.push({ name: 'Historical Consistency', status: 'skip', flags: ['Check failed'] });
    }

    // 5. Production Ceiling
    if (ceiling.status === 'fulfilled') {
      const r = ceiling.value;
      const flags: string[] = [];
      if (r.yieldMismatch) flags.push('Configured yield exceeds irradiance estimate');
      const violations = r.recentReadings?.filter((rd: any) => rd.exceedsCeiling) || [];
      if (violations.length > 0) flags.push(`${violations.length} reading(s) exceed ceiling`);
      sections.push({
        name: 'Production Ceiling',
        status: violations.length > 0 ? 'fail' : r.yieldMismatch ? 'warn' : 'pass',
        flags,
      });
    } else {
      sections.push({ name: 'Production Ceiling', status: 'skip', flags: ['Check failed'] });
    }

    // 6. Cross-Source
    if (crossSource.status === 'fulfilled') {
      const r = crossSource.value;
      const criticals = r.flags?.filter((f: any) => f.severity === 'critical') || [];
      const warnings = r.flags?.filter((f: any) => f.severity === 'warning') || [];
      const flags: string[] = [];
      if (criticals.length > 0) flags.push(`${criticals.length} critical flag(s)`);
      if (warnings.length > 0) flags.push(`${warnings.length} warning(s)`);
      sections.push({
        name: 'Cross-Source Verification',
        status: criticals.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass',
        flags,
        detail: { performanceFactor: r.performanceFactor, rSquared: r.rSquared },
      });
    } else {
      sections.push({ name: 'Cross-Source Verification', status: 'skip', flags: ['Check failed'] });
    }

    // 7. Photo GPS
    if (photoGps.status === 'fulfilled') {
      const r = photoGps.value;
      const flags: string[] = [];
      if (r.summary.total === 0) flags.push('No project photos uploaded');
      const noGps = r.summary.total - r.summary.withGps;
      if (noGps > 0) flags.push(`${noGps} photo(s) without GPS`);
      if (r.summary.flagged > 0) flags.push(`${r.summary.flagged} photo(s) exceed ${r.thresholdMeters}m`);
      sections.push({
        name: 'Photo GPS',
        status: r.summary.flagged > 0 ? 'fail' : r.summary.total === 0 || noGps > 0 ? 'warn' : 'pass',
        flags,
      });
    } else {
      sections.push({ name: 'Photo GPS', status: 'skip', flags: ['Check failed'] });
    }

    // 8. Compensating Controls (only relevant for Mode 4)
    if (controls.status === 'fulfilled') {
      const r = controls.value;
      if (r.isMode4) {
        const unsatisfied = r.controls.filter((c: any) => !c.satisfied);
        sections.push({
          name: 'Compensating Controls',
          status: unsatisfied.length > 0 ? 'fail' : 'pass',
          flags: unsatisfied.map((c: any) => c.label),
        });
      }
      // Omit section entirely if not Mode 4
    }
    // If controls check failed but was attempted, still skip
    if (controls.status === 'rejected') {
      // Only add if we can't tell whether it's Mode 4 — err on side of inclusion
      sections.push({ name: 'Compensating Controls', status: 'skip', flags: ['Check failed'] });
    }

    // 9. SLD Capacity Compare
    if (sldCompare.status === 'fulfilled') {
      const r = sldCompare.value;
      const flags: string[] = [];
      if (!r.hasSld) flags.push('No SLD document uploaded');
      else if (r.sldCapacityKw == null) flags.push('SLD capacity not yet entered by reviewer');
      else if (r.match === false) flags.push(`SLD says ${r.sldCapacityKw} kW, registered ${r.registeredCapacityKw} kW (${r.differencePercent > 0 ? '+' : ''}${r.differencePercent}%)`);
      sections.push({
        name: 'SLD Capacity Compare',
        status: !r.hasSld ? 'warn' : r.match === false ? 'fail' : r.match === true ? 'pass' : 'warn',
        flags,
      });
    } else {
      sections.push({ name: 'SLD Capacity Compare', status: 'skip', flags: ['Check failed'] });
    }

    // Overall status
    const hasAnyFail = sections.some((s) => s.status === 'fail');
    const hasAnyWarn = sections.some((s) => s.status === 'warn');
    const overallStatus = hasAnyFail ? 'fail' : hasAnyWarn ? 'warn' : 'pass';

    const now = new Date().toISOString();

    await this.logAudit(deviceId, 'auto_screen_report',
      `Auto-screen: ${overallStatus} — ${sections.filter(s => s.status === 'fail').length} fail, ${sections.filter(s => s.status === 'warn').length} warn, ${sections.filter(s => s.status === 'pass').length} pass`,
      'reviewer', { overallStatus, sections: sections.map(s => ({ name: s.name, status: s.status })) });

    // Persist last screen result on device
    await this.connection.query(
      `UPDATE device SET last_screen_status = $1, last_screened_at = $2 WHERE id = $3`,
      [overallStatus, now, deviceId],
    );

    return {
      deviceId,
      sections,
      overallStatus,
      timestamp: now,
    };
  }

  /**
   * D-REC VA layer: Set the SLD-stated capacity (kW) for a device.
   * Reviewer reads the value from the Single Line Diagram and enters it here.
   */
  async setSldCapacity(
    deviceId: number,
    sldCapacityKw: number,
  ): Promise<{ sldCapacityKw: number }> {
    const rows = await this.connection.query(
      `SELECT id FROM device WHERE id = $1`,
      [deviceId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    await this.connection.query(
      `UPDATE device SET sld_capacity_kw = $1 WHERE id = $2`,
      [sldCapacityKw, deviceId],
    );
    await this.logAudit(deviceId, 'sld_capacity_set',
      `SLD capacity set to ${sldCapacityKw} kW`,
      'reviewer', { sldCapacityKw });
    return { sldCapacityKw };
  }

  /**
   * D-REC VA layer: Compare SLD-stated capacity against registered capacity.
   * Flags mismatch if difference exceeds ±10%.
   */
  async compareSldCapacity(deviceId: number): Promise<{
    registeredCapacityKw: number | null;
    sldCapacityKw: number | null;
    hasSld: boolean;
    differencePercent: number | null;
    tolerancePercent: number;
    match: boolean | null;
  }> {
    const TOLERANCE = 10; // ±10%
    const rows: any[] = await this.connection.query(
      `SELECT capacity, sld_capacity_kw FROM device WHERE id = $1`,
      [deviceId],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const registered = rows[0].capacity != null ? parseFloat(rows[0].capacity) : null;
    const sld = rows[0].sld_capacity_kw != null ? parseFloat(rows[0].sld_capacity_kw) : null;

    // Check if SLD document exists
    const docs = await this.connection.query(
      `SELECT id FROM documents
       WHERE target_id = $1 AND target_type = 'device' AND type = 'SINGLE_LINE_DIAGRAM'
       LIMIT 1`,
      [deviceId],
    );
    const hasSld = docs.length > 0;

    if (registered == null || sld == null) {
      return {
        registeredCapacityKw: registered,
        sldCapacityKw: sld,
        hasSld,
        differencePercent: null,
        tolerancePercent: TOLERANCE,
        match: null,
      };
    }

    const diff = registered > 0
      ? ((sld - registered) / registered) * 100
      : (sld === 0 ? 0 : 100);
    const match = Math.abs(diff) <= TOLERANCE;

    return {
      registeredCapacityKw: Math.round(registered * 100) / 100,
      sldCapacityKw: Math.round(sld * 100) / 100,
      hasSld,
      differencePercent: Math.round(diff * 10) / 10,
      tolerancePercent: TOLERANCE,
      match,
    };
  }

  async bulkUpdateReviewStatus(
    deviceIds: number[],
    status: string,
    ipAddress?: string,
  ): Promise<Array<{ deviceId: number; status: string; error?: string }>> {
    const results: Array<{ deviceId: number; status: string; error?: string }> = [];
    for (const id of deviceIds) {
      try {
        const res = await this.updateReviewStatus(id, status, ipAddress);
        results.push({ deviceId: id, status: res.status });
      } catch (err: any) {
        results.push({ deviceId: id, status: 'error', error: err.message });
      }
    }
    // Log bulk action to audit trail for each affected device
    const succeeded = results.filter((r) => r.status !== 'error').map((r) => r.deviceId);
    for (const id of succeeded) {
      await this.logAudit(
        id,
        'bulk_status_change',
        `Bulk status change to "${status}" (${deviceIds.length} devices in batch)`,
        'reviewer',
        { batchSize: deviceIds.length, targetStatus: status },
        ipAddress,
      );
    }
    return results;
  }

  async bulkAutoScreen(
    deviceIds?: number[],
  ): Promise<Array<{ deviceId: number; overallStatus: string; error?: string }>> {
    // If no IDs provided, screen all unscreened pending devices
    let ids = deviceIds;
    if (!ids || ids.length === 0) {
      const rows: any[] = await this.connection.query(
        `SELECT d.id FROM device d
         LEFT JOIN submissions s
           ON regexp_replace(lower(d."projectName"), '[^a-z0-9]+', '-', 'g')
            = regexp_replace(s.project_subfolder,
                '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                '', 'i')
         WHERE d."externalId" IS NOT NULL AND d."externalId" <> ''
           AND d.last_screen_status IS NULL
           AND (s.status IS NULL OR s.status = 'pending')
         ORDER BY d."createdAt" DESC
         LIMIT 50`,
      );
      ids = rows.map((r) => r.id);
    }

    const results: Array<{ deviceId: number; overallStatus: string; error?: string }> = [];
    for (const id of ids) {
      try {
        const res = await this.autoScreenReport(id);
        results.push({ deviceId: id, overallStatus: res.overallStatus });
      } catch (err: any) {
        results.push({ deviceId: id, overallStatus: 'error', error: err.message });
      }
    }
    return results;
  }
}

/** Haversine distance in meters between two lat/lng points. */
function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
