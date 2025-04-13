import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DocumentUploadsDTO {
  @ApiProperty({
    description: 'ID of the legal entity',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  legalEntityId: number;

  @ApiProperty({
    description: 'Path or URL to the incorporation certificate document',
    example: 'uploads/incorporation-certificate.pdf',
  })
  @IsString()
  @IsNotEmpty()
  incorporationCertificate: string;

  @ApiProperty({
    description: 'Path or URL to the legal representative passport document',
    example: 'uploads/legal-representative-passport.pdf',
  })
  @IsString()
  @IsNotEmpty()
  legalRepresentativePassport: string;

  @ApiProperty({
    description: 'Path or URL to the address proof document',
    example: 'uploads/address-proof.pdf',
  })
  @IsString()
  @IsNotEmpty()
  addressProof: string;

  @ApiProperty({
    description: 'Path or URL to the owners declaration document',
    example: 'uploads/owners-declaration.pdf',
  })
  @IsString()
  @IsNotEmpty()
  ownersDeclaration: string;
}
