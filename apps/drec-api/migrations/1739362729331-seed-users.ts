import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcryptjs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '../../../.env' });

export class SeedUsers1739362729331 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const buyerEmail = process.env.BUYER_EMAIL;
    const developerEmail = process.env.DEVELOPER_EMAIL;
    const buyerPassword = await bcrypt.hash(process.env.BUYER_PASSWORD, 8);
    const developerPassword = await bcrypt.hash(
      process.env.DEVELOPER_PASSWORD,
      8,
    );

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

    const buyerOrgId = await queryRunner.query(`
            SELECT id FROM public.organization WHERE "orgEmail" = '${buyerEmail}'
        `);
    const developerOrgId = await queryRunner.query(`
            SELECT id FROM public.organization WHERE "orgEmail" = '${developerEmail}'
        `);

    await queryRunner.query(`
            INSERT INTO public.user (
                "title", "firstName", "lastName", "telephone", "email", "password", "notifications", "status", "role", "organizationId", "roleId", "api_user_id"
            ) VALUES
                (
                    'Mr.', 
                    'John', 
                    'Doe', 
                    '1234567890', 
                    '${process.env.BUYER_EMAIL.toLowerCase()}', 
                    '${buyerPassword}',  
                    false, 
                    'Active', 
                    'Buyer', 
                    ${buyerOrgId[0].id}, 
                    4, 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff8'
                ),
                (
                    'Ms.', 
                    'Jane', 
                    'Smith', 
                    '0987654321', 
                    '${process.env.DEVELOPER_EMAIL.toLowerCase()}', 
                    '${developerPassword}', 
                    false, 
                    'Active', 
                    'OrganizationAdmin', 
                    ${developerOrgId[0].id}, 
                    2, 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff8'
                );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const buyerEmail = process.env.BUYER_EMAIL;
    const developerEmail = process.env.DEVELOPER_EMAIL;
    await queryRunner.query(`
            DELETE FROM "organization" WHERE "orgEmail" IN  ('${buyerEmail}', '${developerEmail}');
        `);

    await queryRunner.query(`
            DELETE FROM "user" WHERE "email" IN ('${buyerEmail}', '${developerEmail}');
        `);
  }
}
