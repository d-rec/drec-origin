import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { DocumentUploadsService } from './document-uploads.service';
import { DocumentUploadsEntity } from './entities/document-upload.entity';
import multer from 'multer';

@ApiTags('document-uploads')
@Controller('document-uploads')
export class DocumentUploadsController {
  constructor(private readonly documentUploadsService: DocumentUploadsService) {}

  @Post(':organizationId')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'incorporationCertificate', maxCount: 1 },
      { name: 'legalRepresentativePassport', maxCount: 1 },
      { name: 'addressProof', maxCount: 1 },
      { name: 'ownersDeclaration', maxCount: 1 },
    ], {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Invalid file type. Only PDF, JPEG, and PNG files are allowed.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'organizationId',
    type: 'number',
    description: 'ID of the organization',
    example: 1,
  })
  @ApiOperation({ summary: 'Create a new document upload' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        incorporationCertificate: {
          type: 'string',
          format: 'binary',
          description: 'Incorporation certificate document',
        },
        legalRepresentativePassport: {
          type: 'string',
          format: 'binary',
          description: 'Legal representative passport document',
        },
        addressProof: {
          type: 'string',
          format: 'binary',
          description: 'Address proof document',
        },
        ownersDeclaration: {
          type: 'string',
          format: 'binary',
          description: 'Owners declaration document',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The document upload has been successfully created.',
    type: DocumentUploadsEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Organization not found.' })
  uploadDocuments(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @UploadedFiles()
    files: {
      incorporationCertificate?: Express.Multer.File[];
      legalRepresentativePassport?: Express.Multer.File[];
      addressProof?: Express.Multer.File[];
      ownersDeclaration?: Express.Multer.File[];
    },
  ) {
    if (!files.incorporationCertificate?.[0] ||
        !files.legalRepresentativePassport?.[0] ||
        !files.addressProof?.[0] ||
        !files.ownersDeclaration?.[0]) {
      throw new BadRequestException('All required documents must be provided');
    }

    return this.documentUploadsService.uploadDocuments({
      organizationId,
      incorporationCertificate: files.incorporationCertificate[0],
      legalRepresentativePassport: files.legalRepresentativePassport[0],
      addressProof: files.addressProof[0],
      ownersDeclaration: files.ownersDeclaration[0],
    });
  }
}