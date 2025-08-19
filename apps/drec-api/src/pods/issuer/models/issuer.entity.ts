import { IsString } from "class-validator";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('issuer')
export class IssuerEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: number;

    @Column({name: 'issuer_id'})
    @IsString()
    issuerId: string;

    @Column()
    @IsString()
    name: string;

    @Column()
    @IsString()
    email: string;
    
    @Column()
    @IsString()
    country: string;
    
    @Column()
    @IsString()
    address: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}