import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FileService } from '../file/file.service';

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
        d."evident_device_id" AS "evidentDeviceId",
        d."evident_status" AS "evidentStatus",
        s.status,
        s.reviewer_name,
        s.submitted_at,
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
        dateSubmitted: r.submitted_at ?? null,
        modifiedDate: r.updatedAt ?? null,
        status: r.status ?? 'draft',
        notes: '',
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
}
