import { MigrationInterface, QueryRunner } from 'typeorm';

// Converts the `url` column in `documents` from a full S3 URL to just the
// S3 object key, since objects are now private and served via pre-signed URLs.
//
// Path-style URL:     http://host/bucket/key  → key
// Virtual-hosted URL: https://bucket.host/key → key
//
// The regex strips everything up to and including the second '/' after the host
// (i.e. scheme + host + /bucket/) for path-style, or scheme + host + / for
// virtual-hosted. Both reduce to the key portion of the path.

export class DocumentsUrlToS3Key1757000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Only update rows whose url still looks like a full URL (starts with http)
    await queryRunner.query(`
      UPDATE "documents"
      SET "url" = regexp_replace("url", '^https?://[^/]+/[^/]+/', '')
      WHERE "url" LIKE 'http%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Down migration cannot reconstruct the original URLs without knowing the
    // endpoint and bucket, so this is intentionally left as a no-op.
  }
}
