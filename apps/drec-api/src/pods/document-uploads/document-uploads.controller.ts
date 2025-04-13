import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DocumentUploadsService } from './document-uploads.service';
import { DocumentUploadsEntity } from './entities/document-upload.entity';

@ApiTags('document-uploads')
@Controller('document-uploads')
export class DocumentUploadsController {
  constructor(
    private readonly documentUploadsService: DocumentUploadsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new document upload' })
  @ApiResponse({
    status: 201,
    description: 'The document upload has been successfully created.',
    type: DocumentUploadsEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Legal entity not found.' })
  uploadDocuments(): any {
    return this.documentUploadsService.uploadDocuments();
  }
}
