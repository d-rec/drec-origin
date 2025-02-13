import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '../../../.env' });
export class SeedDevices1739436404184 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const orgIdResult = await queryRunner.query(`
            SELECT id FROM public.organization WHERE "orgEmail" = '${process.env.DEVELOPER_EMAIL.toLowerCase()}'
        `);

    const orgId = orgIdResult[0].id;
    await queryRunner.query(`
            INSERT INTO public.device (
                "externalId", 
                "organizationId", 
                "projectName", 
                "address", 
                "latitude", 
                "longitude", 
                "countryCode", 
                "fuelCode", 
                "deviceTypeCode", 
                "capacity", 
                "commissioningDate", 
                "gridInterconnection", 
                "offTaker", 
                "yieldValue", 
                "labels", 
                "impactStory", 
                "images", 
                "deviceDescription", 
                "energyStorage", 
                "energyStorageCapacity", 
                "qualityLabels", 
                "deviceOEM", 
                "SDGBenefits", 
                "groupId", 
                "meterReadtype", 
                "developerExternalId", 
                "timezone", 
                "version", 
                "IREC_Status", 
                "IREC_ID", 
                "api_user_id"
            ) VALUES
                (
                    '${uuidv4()}', 
                    ${orgId}, 
                    'Project Alpha', 
                    '123 Main St, City A', 
                    '12.3456', 
                    '65.4321', 
                    'ALB', 
                    'ES100', 
                    'TC120', 
                    1000.0, 
                    '2023-01-01', 
                    true, 
                    'OffTaker A', 
                    2000, 
                    'Label1', 
                    'Impact story for device 1', 
                    'image1.jpg', 
                    null, 
                    false, 
                    null, 
                    'Quality Label 1', 
                    null, 
                    'SDG Benefits 1', 
                    null, 
                    null, 
                    'Solar Panel Array 1', 
                    'UTC', 
                    '1.0', 
                    'NotRegistered', 
                    null, 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff9'
                ),
                (
                    '${uuidv4()}', 
                    ${orgId}, 
                    'Project Beta', 
                    '456 Elm St, City B', 
                    '34.5678', 
                    '78.9012', 
                    'ALB', 
                    'ES100', 
                    'TC120', 
                    2500.0, 
                    '2023-02-01', 
                    false, 
                    'OffTaker B', 
                    2500, 
                    'Label2', 
                    'Impact story for device 2', 
                    'image2.jpg', 
                    null, 
                    true, 
                    50.0, 
                    'Quality Label 2', 
                    null, 
                    'SDG Benefits 2', 
                    null, 
                    null, 
                    'Wind Turbine Model X', 
                    'UTC', 
                    '1.0', 
                    'NotRegistered', 
                    null, 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff0'
                ),
                (
                    '${uuidv4()}', 
                    ${orgId}, 
                    'Project Gamma', 
                    '789 Oak St, City C', 
                    '56.7890', 
                    '12.3456', 
                    'ALB', 
                    'ES100', 
                    'TC130', 
                    3000.0, 
                    '2023-03-01', 
                    true, 
                    'OffTaker C', 
                    3000, 
                    'Label3', 
                    'Impact story for device 3', 
                    'image3.jpg', 
                    null, 
                    false, 
                    null, 
                    'Quality Label 3', 
                    null, 
                    'SDG Benefits 3', 
                    null, 
                    null, 
                    'Battery Storage System', 
                    'UTC', 
                    '1.0', 
                    'NotRegistered', 
                    null, 
                    'e0ab91a4-03bc-4447-9d00-c51260fd6ff9'
                );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM public.device WHERE "projectName" IN ('Project Alpha', 'Project Beta', 'Project Gamma');
        `);
  }
}
