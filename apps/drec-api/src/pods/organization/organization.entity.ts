import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { IsEnum, IsISO31661Alpha2, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IFullOrganization } from '../../models';
import { OrganizationStatus } from '../../utils/enums';
import { User } from '../user/user.entity';
import { Invitation } from '../invitation/invitation.entity';

@Entity({ name: 'organization' })
export class Organization
  extends ExtendedBaseEntity
  implements IFullOrganization
{
  constructor(organization?: Partial<Organization>) {
    super();
    Object.assign(this, organization);
  }

  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  address: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  zipCode: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  city: string;

  @ApiProperty({ type: String })
  @Column()
  @IsISO31661Alpha2()
  country: string;

  @Column({ nullable: true, unique: true })
  blockchainAccountAddress: string;

  @Column()
  @IsString()
  businessType: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  tradeRegistryCompanyNumber: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  vatNumber: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  signatoryFullName: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  signatoryAddress: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  signatoryZipCode: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  signatoryCity: string;

  @ApiProperty({ type: String })
  @Column()
  @IsISO31661Alpha2()
  signatoryCountry: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  signatoryEmail: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  signatoryPhoneNumber: string;

  @ApiProperty({ enum: OrganizationStatus, enumName: 'OrganizationStatus' })
  @Column({ default: OrganizationStatus.Submitted })
  @IsEnum(OrganizationStatus)
  status: OrganizationStatus;

  @ApiProperty({ type: () => [User] })
  @OneToMany(() => User, (user) => user.organization, {
    cascade: true,
    eager: true,
  })
  users: User[];

  @ApiProperty({ type: () => [Invitation] })
  @OneToMany(() => Invitation, (invitation) => invitation.organization, {
    eager: true,
  })
  invitations: Invitation[];
}
