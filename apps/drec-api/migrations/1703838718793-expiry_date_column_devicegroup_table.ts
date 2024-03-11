import { MigrationInterface, QueryRunner } from 'typeorm';

export class expiryDateColumnDevicegroupTable1703838718793
  implements MigrationInterface
{
  name = 'expiryDateColumnDevicegroupTable1703838718793';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD "reservationExpiryDate" timestamp with time zone `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
