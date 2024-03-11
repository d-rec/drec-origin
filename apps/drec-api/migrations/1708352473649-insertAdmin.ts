import { MigrationInterface, QueryRunner } from "typeorm";
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';


export class insertAdmin1708352473649 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const adminJSON = JSON.parse(fs.readFileSync(__dirname+'/admin.json', 'utf-8'));
        const roleJSON = JSON.parse(fs.readFileSync(__dirname+'/user_role.json', 'utf-8'));

        const adminExists = await queryRunner.query(`SELECT id FROM public.user WHERE "role" = '${roleJSON[0].name}'`);

        if (!adminExists.length) {
            const api_user = await queryRunner.query(`INSERT INTO public.api_user (
                "api_user_id",
                "permission_status"
                ) VALUES (
                    '${uuid()}',
                    'Request'
                )
                RETURNING "api_user_id"
            `);

            const api_user_id = api_user[0].api_user_id;

            const organization = await queryRunner.query(`INSERT INTO public.organization (
                "id",
                "name",
                "address",
                "organizationType",
                "orgEmail", 
                "status",
                "api_user_id"
                ) VALUES (
                    '${adminJSON.id}', 
                    '${process.env.ADMIN_ORG_NAME}', 
                    '${process.env.ADMIN_ORG_ADDRESS}', 
                    '${adminJSON.organizationType}', 
                    '${process.env.ADMIN_EMAIL}', 
                    '${adminJSON.status}', 
                    '${api_user_id}'
                )
                RETURNING "id"
            `);

            const organizationId = organization[0].id;
            const password = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 8);


            await queryRunner.query(`INSERT INTO public.user (
                "id",
                "firstName",
                "lastName",
                "email",
                "password",
                "status",
                "role", 
                "organizationId",
                "roleId",
                "api_user_id"
                ) VALUES (
                    '${adminJSON.id}', 
                    '${process.env.ADMIN_FNAME}', 
                    '${process.env.ADMIN_LNAME}', 
                    '${process.env.ADMIN_EMAIL.toLowerCase()}', 
                    '${password}', 
                    '${adminJSON.status}', 
                    '${roleJSON[0].name}',    
                    '${organizationId}',
                    '${roleJSON[0].id}',
                    '${api_user_id}'
                )`
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
