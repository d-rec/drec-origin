import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateDeveloperToMarketIntermediary1759900400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Developer orgs whose user has role=MarketIntermediary → become MarketIntermediary
    await queryRunner.query(`
      UPDATE "organization" o
      SET "organizationType" = 'MarketIntermediary'
      FROM "user" u
      WHERE u."organizationId" = o.id
        AND o."organizationType" = 'Developer'
        AND u.role = 'MarketIntermediary'
    `);

    // All remaining Developer orgs (sub-orgs managed by an MI) → become SiteOperator
    await queryRunner.query(`
      UPDATE "organization"
      SET "organizationType" = 'SiteOperator'
      WHERE "organizationType" = 'Developer'
    `);
  }

  public async down(): Promise<void> {
    // Cannot reliably reverse — we don't know which orgs were originally Developer
    // This is intentionally a no-op
  }
}
