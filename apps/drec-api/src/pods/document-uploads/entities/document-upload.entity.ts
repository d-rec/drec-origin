import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('document_uploads')
export class DocumentUploadsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID of the legal entity',
  })
  @Column({ name: 'organization_id' })
  @IsNumber()
  @IsNotEmpty()
  organizationId: number;

  @ApiProperty({
    description: 'Path or URL to the incorporation certificate document',
  })
  @Column({ name: 'incorporation_certificate' })
  @IsString()
  @IsNotEmpty()
  incorporationCertificate: string;

  @ApiProperty({
    description: 'Path or URL to the legal representative passport document',
  })
  @Column({ name: 'legal_representative_passport' })
  @IsString()
  @IsNotEmpty()
  legalRepresentativePassport: string;

  @ApiProperty({
    description: 'Path or URL to the address proof document',
  })
  @Column({ name: 'address_proof' })
  @IsString()
  @IsNotEmpty()
  addressProof: string;

  @ApiProperty({
    description: 'Path or URL to the owners declaration document',
  })
  @Column({ name: 'owners_declaration' })
  @IsString()
  @IsNotEmpty()
  ownersDeclaration: string;
}
