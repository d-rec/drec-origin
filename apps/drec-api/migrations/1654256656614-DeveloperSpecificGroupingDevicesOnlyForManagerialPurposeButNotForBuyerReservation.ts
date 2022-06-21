import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservation1654256656614
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE  developer_specific_manageGroupDevices_notFor_buyerReservation(
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id" SERIAL PRIMARY KEY     NOT NULL,
                "organizationId" integer NOT NULL references organization(id),
                "groupedByUserId" integer NOT NULL,    
                "name"           TEXT    NOT NULL,
                "deviceIds"   integer[]
                            

             );`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
