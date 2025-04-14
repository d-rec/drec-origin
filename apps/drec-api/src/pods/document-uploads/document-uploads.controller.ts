import {
  Controller,
  Post,
  UseInterceptors,
  BadRequestException,
  Param,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentUploadsService } from './document-uploads.service';
import {
  DocumentEntity,
  DocumentTargetType,
  DocumentType,
} from './entities/documents.entity';
import multer from 'multer';
import { Logger } from '@nestjs/common';

@ApiTags('document-uploads')
@Controller('document-uploads')
export class DocumentUploadsController {
  private readonly logger = new Logger(DocumentUploadsController.name);

  constructor(
    private readonly documentUploadsService: DocumentUploadsService,
  ) {}

  @Post(':targetId')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'document', maxCount: 1 }], {
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
    name: 'targetId',
    type: 'number',
    description: 'ID of the target entity',
    example: 1,
  })
  @ApiQuery({
    name: 'targetType',
    enum: DocumentTargetType,
    description: 'Type of the target entity',
    example: DocumentTargetType.ORGANIZATION,
  })
  @ApiQuery({
    name: 'documentType',
    enum: DocumentType,
    description: 'Type of the document',
    example: DocumentType.INCORPORATION_CERTIFICATE,
  })
  @ApiOperation({ summary: 'Upload a document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The document has been successfully uploaded.',
    type: DocumentEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Target entity not found.' })
  uploadDocuments(
    @UploadedFiles() files: { document?: Express.Multer.File[] },
    @Param('targetId') targetId: number,
    @Query('targetType') targetType: DocumentTargetType,
    @Query('documentType') documentType: DocumentType,
  ): Promise<DocumentEntity> {
    if (!files || !files.document || files.document.length === 0) {
      throw new BadRequestException('No document provided');
    }

    const document = files.document[0];

    return this.documentUploadsService.uploadDocument({
      targetId,
      targetType,
      documentType,
      document,
    });
  }
}
