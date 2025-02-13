import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedOrganizations1739456130220 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const buyerEmail = process.env.BUYER_EMAIL;
    const developerEmail = process.env.DEVELOPER_EMAIL;
    await queryRunner.query(`
            INSERT INTO public.organization (
                "name", 
                "orgEmail", 
                "organizationType", 
                "api_user_id",
                "status"
            )VALUES
                (
                    'John Doe', 
                    '${buyerEmail.toLowerCase()}', 
                    'Buyer', 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff8', 
                    'Active'
                ),
                (
                    'Jane Smith', 
                    '${developerEmail.toLowerCase()}', 
                    'Developer', 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff8', 
                    'Active'
                );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const buyerEmail = process.env.BUYER_EMAIL;
    const developerEmail = process.env.DEVELOPER_EMAIL;
    await queryRunner.query(`
            DELETE FROM "organization" WHERE "orgEmail" IN  ('${buyerEmail}', '${developerEmail}');
        `);
  }
}
