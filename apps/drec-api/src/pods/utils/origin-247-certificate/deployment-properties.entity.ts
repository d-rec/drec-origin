import { PrimaryColumn, Entity, Column } from 'typeorm';

export const tableName = 'certificate_deployment_properties';
@Entity(tableName)
export class DeploymentPropertiesEntity {
    @PrimaryColumn()
    registry: string;

    @Column()
    issuer: string;
}
