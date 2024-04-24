/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FILE_SUPPORTED_MIMETYPES } from '@energyweb/origin-backend-core';
import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import multer from 'multer';

import { FileDto } from './file.dto';
import { FileUploadDto } from './file-upload.dto';
import { FileService } from './file.service';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

const maxFilesLimit = parseInt(process.env.FILE_MAX_FILES!, 10) || 20;
const maxFileSize = parseInt(process.env.FILE_MAX_FILE_SIZE!, 10) || 10485760;

const supportedFiles = FILE_SUPPORTED_MIMETYPES;
supportedFiles.push('text/csv');
supportedFiles.push('image/jpeg');
supportedFiles.push('image/png');

/**
 * It is controller for file operations
 */
@ApiTags('file')
@ApiBearerAuth('access-token')
@Controller('file')
export class FileController {
  private readonly logger = new Logger(FileController.name);
  constructor(private readonly fileService: FileService) {}

  /**
   * It is POST api to upload multiple files into aws s3 bucket
   * @param user from request
   * @param param1 is getting organization id from request
   * @param uploadedFiles array of files to be uploaded
   * @returns {}
   */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: maxFilesLimit }], {
      storage: multer.memoryStorage(),
      fileFilter: (req: Request, file, callback) => {
        if (!supportedFiles.includes(file.mimetype)) {
          callback(new Error('Unsupported file type'), false);
        }

        callback(null, true);
      },
      limits: {
        files: maxFilesLimit,
        fileSize: maxFileSize,
      },
    }),
  )
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('FILE_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [String],
    description: 'Upload a file',
  })
  async upload(
    @UserDecorator() user: ILoggedInUser,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @UploadedFiles()
    uploadedFiles: {
      files: Express.Multer.File[];
    },
  ) {
    this.logger.verbose(`With in upload`);

    return await Promise.all(
      uploadedFiles.files.map(async (file) => {
        const response: any = await this.fileService.upload(file);
        return response.key;
      }),
    );
  }

  /**
   * It is GET api to view or download an file from AWS S3 bucket
   * @param user from request
   * @param id is unique identifier of file entity
   * @param res is Response type
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('FILE_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: FileDto,
    description: 'Download a file',
  })
  @ApiNotFoundResponse({ description: `The file doesn't exist` })
  async download(
    @UserDecorator() user: ILoggedInUser,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.verbose(`With in download`);
    const file = await this.fileService.get(id, user);
    if (!file) {
      this.logger.error('File not found');
      throw new NotFoundException();
    }

    res
      .set({
        'Content-Type': file.contentType,
        'Content-Length': file.data.length,
      })
      .send(file.data);
  }
}
