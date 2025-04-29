import {
  Controller,
  Post,
  UseInterceptors,
  BadRequestException,
  Query,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentUploadsService } from './document-uploads.service';
import {
  DocumentEntity,
  DocumentTargetType,
  DocumentType,
} from './entities/documents.entity';
import multer from 'multer';
import { Logger } from '@nestjs/common';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard(['jwt', 'oauth2-client-password']))
@ApiTags('document-uploads')
@Controller('document-uploads')
export class DocumentUploadsController {
  private readonly logger = new Logger(DocumentUploadsController.name);

  constructor(
    private readonly documentUploadsService: DocumentUploadsService,
  ) {}

  @Post()
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
  @ApiOperation({
    summary: 'Upload a document',
    description:
      'Upload a single document file (PDF, JPEG, or PNG) associated with a specific target type and document type. The file will be linked to the authenticated user.',
  })
  @ApiQuery({
    name: 'targetType',
    enum: DocumentTargetType,
    description: 'Type of entity the document belongs to (e.g., ORGANIZATION)',
    required: true,
    example: DocumentTargetType.ORGANIZATION,
  })
  @ApiQuery({
    name: 'documentType',
    enum: DocumentType,
    description:
      'Category or type of the document being uploaded (e.g., INCORPORATION_CERTIFICATE)',
    required: true,
    example: DocumentType.INCORPORATION_CERTIFICATE,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['document'],
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description:
            'The document file to upload (PDF, JPEG, or PNG format only)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document has been successfully uploaded and processed.',
    type: DocumentEntity,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid file type, missing document, or invalid parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - User does not have permission to upload documents.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found - Target entity specified in targetType does not exist.',
  })
  @ApiParam({
    name: 'user',
    type: 'object',
    description: 'Currently logged in user details (automatically injected)',
    required: true,
  })
  upload(
    @UploadedFiles() files: { document?: Express.Multer.File[] },
    @UserDecorator() user: ILoggedInUser,
    @Query('targetType') targetType: DocumentTargetType,
    @Query('documentType') documentType: DocumentType,
  ): Promise<DocumentEntity> {
    if (!files || !files.document || files.document.length === 0) {
      throw new BadRequestException('No document provided');
    }

    const documents = files.document[0];

    return this.documentUploadsService.upload({
      user,
      targetType,
      documentType,
      documents,
    });
  }
}
