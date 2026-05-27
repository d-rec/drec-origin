import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
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
import { FileService } from '../file/file.service';
import { mimeFromKey } from '../file/file.service';
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
    private readonly fileService: FileService,
  ) {}

  @Get(':id/url')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  // Match the device-level /device/:id/documents ACL so reviewers
  // who can list a device's docs can also stream them. Previously
  // SUBMISSION_MANAGEMENT_CRUDL — reviewers got 403 on EVIDENCE_PROVENANCE.
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Stream a document inline',
    description:
      'Streams the document bytes through the API. Avoids exposing the ' +
      'browser to an S3/MinIO host that may not have CORS configured for ' +
      'the portal origin.',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async streamDocument(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const { key, filename } =
      await this.documentUploadsService.getDocumentMeta(id);
    const s3 = this.fileService.getS3();
    res.setHeader('Content-Type', mimeFromKey(key));
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${filename.replace(/"/g, '')}"`,
    );
    const stream = s3
      .getObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key })
      .createReadStream();
    stream.on('error', (err: Error) => {
      if (!res.headersSent) {
        res.status(404).json({ message: err.message });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  }

  @Put(':id/extractions/:endpoint')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary:
      'Persist an AI extraction result against a document so the next ' +
      'session can rehydrate without re-running OCR / Haiku.',
  })
  async saveExtraction(
    @Param('id', ParseIntPipe) id: number,
    @Param('endpoint') endpoint: string,
    @Body() body: Record<string, any>,
  ): Promise<{ ok: true }> {
    if (!endpoint || !/^[a-z0-9-]+$/i.test(endpoint)) {
      throw new BadRequestException('Invalid endpoint');
    }
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Body must be a JSON object');
    }
    await this.documentUploadsService.saveExtraction(id, endpoint, body);
    return { ok: true };
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
