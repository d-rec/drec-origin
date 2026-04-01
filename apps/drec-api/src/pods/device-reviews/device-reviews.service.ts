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

  async updateReviewStatus(
    deviceId: number,
    status: string,
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
}
