import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { FileService } from '../file/file.service';

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
}

@Injectable()
export class DeviceReviewsService {
  private readonly logger = new Logger(DeviceReviewsService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly fileService: FileService,
  ) {}

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
        u.email AS submitter_email
      FROM device d
      LEFT JOIN submissions s
        ON regexp_replace(lower(d."projectName"), '[^a-z0-9]+', '-', 'g')
         = regexp_replace(s.project_subfolder,
             '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
             '', 'i')
      LEFT JOIN public.user u ON u."organizationId" = d."organizationId"
        AND u.role = 'OrganizationAdmin'
      WHERE d."externalId" IS NOT NULL AND d."externalId" <> ''
      ORDER BY d."createdAt" DESC
    `);

    const docRows: any[] = await this.connection.query(
      `SELECT target_id, type, url FROM documents WHERE target_type = 'device'`,
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
          signedUrls[key] = await this.fileService.getSignedUrl(decodeURIComponent(key));
        } catch {
          signedUrls[key] = null;
        }
      }),
    );

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

      return {
        id:                  String(r.id),
        serial:              r.externalId ?? r.developerExternalId ?? '',
        lat:                 r.latitude  ? parseFloat(r.latitude)  : null,
        long:                r.longitude ? parseFloat(r.longitude) : null,
        projectName:         r.projectName ?? '',
        capacity:            r.capacity  != null ? parseFloat(r.capacity)  : null,
        acCapacity:          r.acCapacity != null ? parseFloat(r.acCapacity) : null,
        countryCode:         r.countryCode ?? '',
        submitterEmail:      r.submitter_email ?? '',
        reviewer:            r.reviewer_name ?? '',
        dateAdded:           r.createdAt ?? null,
        dateSubmitted:       r.submitted_at ?? null,
        modifiedDate:        r.updatedAt ?? null,
        status:              r.status ?? 'pending',
        notes:               '',
        evidentDeviceId:     r.evidentDeviceId ?? null,
        evidentStatus:       r.evidentStatus ?? null,
        codProofUrl:         byType('COD_PROOF'),
        sldUrl:              byType('SINGLE_LINE_DIAGRAM'),
        sf02Url:             byType('FORM_SF_02'),
        sf02cUrl:            byType('SF_02C'),
        meteringEvidenceUrl: byType('METERING_EVIDENCE'),
        pictureUrls:         allOfType('PROJECT_PHOTOS'),
      };
    });
  }
}
