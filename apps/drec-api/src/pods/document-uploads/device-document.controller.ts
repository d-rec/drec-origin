import {
    Controller,
    Post,
    UseInterceptors,
    BadRequestException,
    UploadedFiles,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { FileFieldsInterceptor } from '@nestjs/platform-express';
  import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiResponse,
    ApiBody,
    ApiQuery,
  } from '@nestjs/swagger';
  import { DeviceDocumentsService } from './device-document.service';
  import { DeviceDocument, DocumentType } from './entities/device-documents.entity';
  import multer from 'multer';
  import { AuthGuard } from '@nestjs/passport';
  
  const allowedMimeTypes = [
    'image/avif',
    'image/bmp',
    'image/gif',
    'image/x-icon',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/svg+xml',
    'image/tiff',
    'image/tif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
  ];
  
  @ApiTags('Device-documents')
  @UseGuards(AuthGuard('jwt'))
  @Controller('Device-documents')
  export class DeviceDocumentsController {
    constructor(
      private readonly deviceDocumentsService: DeviceDocumentsService,
    ) {}
  
    @Post()
    @UseInterceptors(
      FileFieldsInterceptor([{ name: 'documents', maxCount: 20 }], {
        storage: multer.memoryStorage(),
        fileFilter: (req, file, callback) => {
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
              new BadRequestException(
                `Unsupported file type: ${file.originalname}`,
              ),
              false,
            );
          }
  
          if (file.size > 20 * 1024 * 1024) {
            return callback(
              new BadRequestException(
                `${file.originalname} exceeds max file size of 20MB`,
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
      summary: 'Upload multiple device documents',
      description:
        'Upload multiple documents to a device. Each document is linked by its documentType.',
    })
    @ApiQuery({
      name: 'deviceId',
      type: Number,
      required: true,
    })
    @ApiQuery({
      name: 'documentType',
      type: String,
      enum: DocumentType,
      required: true,
      description: 'Document type applied to all uploaded files',
    })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          documents: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
          },
        },
        required: ['documents'],
      },
    })
    @ApiResponse({
      status: 201,
      description: 'Documents uploaded successfully',
      type: [DeviceDocument],
    })
    async upload(
      @Query('deviceId') deviceId: number,
      @Query('documentType') documentType: DocumentType,
      @UploadedFiles() files: { documents?: Express.Multer.File[] },
    ): Promise<DeviceDocument[]> {
      const docs = files?.documents || [];
      if (!docs.length) {
        throw new BadRequestException('No documents provided.');
      }
  
      const savedDocuments: DeviceDocument[] = [];
  
      for (const file of docs) {
        const result = await this.deviceDocumentsService.upload({
          deviceId,
          documentType,
          file,
        });
  
        savedDocuments.push(result);
      }
  
      return savedDocuments;
    }
  }
  