import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcryptjs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '../../../.env' });

export class SeedUsers1739362729331 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const BUYER_EMAIL = process.env.BUYER_EMAIL;
    const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL;
    const BUYER_PASSWORD = await bcrypt.hash(process.env.BUYER_PASSWORD, 8);
    const DEVELOPER_PASSWORD = await bcrypt.hash(
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
                    '${process.env.BUYER_EMAIL.toLowerCase()}', 
                    'Buyer', 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff8', 
                    'Active'
                ),
                (
                    'Jane Smith', 
                    '${process.env.DEVELOPER_EMAIL.toLowerCase()}', 
                    'Developer', 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff8', 
                    'Active'
                );
        `);

    const buyerOrgId = await queryRunner.query(`
            SELECT id FROM public.organization WHERE "orgEmail" = '${BUYER_EMAIL}'
        `);
    const developerOrgId = await queryRunner.query(`
            SELECT id FROM public.organization WHERE "orgEmail" = '${DEVELOPER_EMAIL}'
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
                    '${BUYER_PASSWORD}',  
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
                    '${DEVELOPER_PASSWORD}', 
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
    const BUYER_EMAIL = process.env.BUYER_EMAIL;
    const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL;
    await queryRunner.query(`
            DELETE FROM "organization" WHERE "orgEmail" IN  ('${BUYER_EMAIL}', '${DEVELOPER_EMAIL}');
        `);

    await queryRunner.query(`
            DELETE FROM "user" WHERE "email" IN ('${BUYER_EMAIL}', '${DEVELOPER_EMAIL}');
        `);
  }
}
