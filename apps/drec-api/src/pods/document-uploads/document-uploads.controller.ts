import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Response } from 'express';
import { DocumentUploadsService } from './document-uploads.service';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

class UpdateDocumentLabelDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string | null;
}

@ApiTags('Document Uploads')
@ApiBearerAuth('access-token')
@Controller('document-uploads')
export class DocumentUploadsController {
  constructor(
    private readonly documentUploadsService: DocumentUploadsService,
  ) {}

  @Get(':id/url')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('SUBMISSION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get a pre-signed download URL for a document',
    description:
      'Returns a temporary pre-signed S3 URL (valid 1 hour) for the requested document.',
  })
  @ApiResponse({ status: 200, type: String })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getSignedUrl(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.documentUploadsService.getSignedUrl(id);
    res.redirect(url);
  }

  @Patch(':id')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Update a document display label' })
  async updateLabel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateDocumentLabelDto,
  ) {
    const doc = await this.documentUploadsService.updateLabel(
      id,
      body.label ?? null,
    );
    return { id: doc.id, label: doc.label };
  }
}
