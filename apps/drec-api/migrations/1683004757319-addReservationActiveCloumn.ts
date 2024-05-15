import { MigrationInterface, QueryRunner } from 'typeorm';

export class addReservationActiveCloumn1683004757319
  implements MigrationInterface
{
  name = 'addReservationActiveCloumn1683004757319';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" ADD COLUMN "reservationActive" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "device_group" DROP COLUMN IF EXISTS "reservationActive"`,
    );  
  }
}
