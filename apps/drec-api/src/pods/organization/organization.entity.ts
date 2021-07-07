import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { IsEnum, IsISO31661Alpha2, IsString } from 'class-validator';
import { Role } from '../../utils/eums/role.enum';

export class IOrganization {
  code: string;
  name: string;
  address: string;
  primaryContact: string;
  telephone: string;
  email: string;
  regNumber: string;
  vatNumber: string;
  regAddress: string;
  country: string;
  blockchainAccountAddress: string;
  role: Role;
}

@Entity({ name: 'organization' })
export class Organization extends ExtendedBaseEntity implements IOrganization {
  constructor(organization?: Partial<Organization>) {
    super();
    Object.assign(this, organization);
  }

  @PrimaryColumn()
  code: string;

  @Column()
  @IsString()
  name: string;

  @Column()
  @IsString()
  address: string;

  @Column()
  primaryContact: string;

  @Column()
  telephone: string;

  @Column()
  email: string;

  @Column()
  @IsString()
  regNumber: string;

  @Column()
  @IsString()
  vatNumber: string;

  @Column()
  @IsString()
  regAddress: string;

  @Column()
  @IsISO31661Alpha2()
  country: string;

  @Column({ unique: true })
  blockchainAccountAddress: string;

  @Column()
  @IsEnum(Role)
  role: Role;
}
