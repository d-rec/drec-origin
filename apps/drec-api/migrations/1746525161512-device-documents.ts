import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceDocumentTypes1746525161513 implements MigrationInterface {
  name = 'AddDeviceDocumentTypes1746525161513';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE document_type ADD VALUE 'Form SF-02 - Production Facility Registration'`,
    );
    await queryRunner.query(
      `ALTER TYPE document_type ADD VALUE 'SF-02C Owner''s Declaration or Proof of Ownership'`,
    );
    await queryRunner.query(
      `ALTER TYPE document_type ADD VALUE 'Metering Evidence'`,
    );
    await queryRunner.query(
      `ALTER TYPE document_type ADD VALUE 'Single Line Diagram'`,
    );
    await queryRunner.query(
      `ALTER TYPE document_type ADD VALUE 'Project Photos'`,
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'Down migration not implemented: Cannot remove values from enum type directly.',
    );
  }
}
