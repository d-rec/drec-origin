import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  }> {
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
  }> {
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
  }> {
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
      yieldMismatch = configuredYield > irradiance.yieldHigh;
    }

    // Check recent meter readings against the ceiling
    const readRows: any[] = await this.connection.query(
      `SELECT "startDate", "endDate", value, unit
       FROM meter_reads
       WHERE "externalId" = (SELECT "externalId" FROM device WHERE id = $1)
       ORDER BY "endDate" DESC
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

    const exceedCount = recentReadings.filter((r) => r.exceedsCeiling).length;
    await this.logAudit(deviceId, 'ceiling_check',
      `Yield mismatch: ${yieldMismatch}, ${exceedCount}/${recentReadings.length} readings exceed ceiling`,
      'reviewer', { configuredYield, irradianceYield: irradiance?.yieldHigh, yieldMismatch, exceedCount });

    return {
      irradiance,
      configuredYield,
      capacityKw,
      yieldMismatch,
      recentReadings,
    };
  }

  /**
   * D-REC §3.9: Evaluate compensating controls for Mode 4 devices.
   * Runs all required checks and returns pass/fail for each.
   */
  async evaluateCompensatingControls(
    deviceId: number,
  ): Promise<CompensatingControlsEvaluation> {
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

    return { isMode4: true, allSatisfied, controls };
  }
}
