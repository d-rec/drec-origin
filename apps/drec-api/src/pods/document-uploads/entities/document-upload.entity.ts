import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('document_uploads')
export class DocumentUploadsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID of the legal entity',
    example: 1,
  })
  @Column()
  @IsNumber()
  @IsNotEmpty()
  legalEntityId: number;

  @ApiProperty({
    description: 'Path or URL to the incorporation certificate document',
    example: 'uploads/incorporation-certificate.pdf',
  })
  @Column()
  @IsString()
  @IsNotEmpty()
  incorporationCertificate: string;

  @ApiProperty({
    description: 'Path or URL to the legal representative passport document',
    example: 'uploads/legal-representative-passport.pdf',
  })
  @Column()
  @IsString()
  @IsNotEmpty()
  legalRepresentativePassport: string;

  @ApiProperty({
    description: 'Path or URL to the address proof document',
    example: 'uploads/address-proof.pdf',
  })
  @Column()
  @IsString()
  @IsNotEmpty()
  addressProof: string;

  @ApiProperty({
    description: 'Path or URL to the owners declaration document',
    example: 'uploads/owners-declaration.pdf',
  })
  @Column()
  @IsString()
  @IsNotEmpty()
  ownersDeclaration: string;
}
