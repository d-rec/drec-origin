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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import multer from 'multer';

import { FileDTO } from './file.dto';
import { FileUploadDTO } from './file-upload.dto';
import { FileService } from './file.service';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { PermissionGuard } from '../../guards/PermissionGuard';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { AuthVerifiedGuard } from '../../guards';

const maxFilesLimit = parseInt(process.env.FILE_MAX_FILES!, 10) || 20;
const maxFileSize = parseInt(process.env.FILE_MAX_FILE_SIZE!, 10) || 10485760;

const supportedFiles = FILE_SUPPORTED_MIMETYPES;
supportedFiles.push('text/csv');
supportedFiles.push('image/jpeg');
supportedFiles.push('image/png');

/**
 * It is controller for file operations
 */
@ApiTags('File')
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
  @ApiBody({ type: FileUploadDTO })
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
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('FILE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Upload Files',
    description:
      'Uploads multiple files to an AWS S3 bucket. The request must include the files in a multipart/form-data format.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [String],
    description: 'Returns an array of file keys for the uploaded files.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided files are invalid or exceed the size limit.',
  })
  async upload(
    @UploadedFiles()
    uploadedFiles: {
      files: Express.Multer.File[];
    },
  ): Promise<string[]> {
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
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('FILE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Download File',
    description:
      'Retrieves a file from the AWS S3 bucket based on the provided file ID. The user must be authenticated and have the necessary permissions to access the file.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FileDTO,
    description: 'Returns the requested file data.',
  })
  @ApiNotFoundResponse({ description: `The file doesn't exist` })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to download files.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to download this file.',
  })
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
