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
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../../auth/roles-guard';
import { Role } from '../../utils/eums';
import { UserDecorator } from '../user/decorators/user.decorator';
import { OrganizationUserDTO } from '../../auth/dto/org-user.dto';

const maxFilesLimit = parseInt(process.env.FILE_MAX_FILES, 10) || 20;
const maxFileSize = parseInt(process.env.FILE_MAX_FILE_SIZE, 10) || 10485760;

@ApiTags('file')
@ApiBearerAuth('access-token')
@Controller('file')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin, Role.DeviceOwner)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: maxFilesLimit }], {
      storage: multer.memoryStorage(),
      fileFilter: (req: Request, file, callback) => {
        if (!FILE_SUPPORTED_MIMETYPES.includes(file.mimetype)) {
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
  @UseGuards(AuthGuard())
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [String],
    description: 'Upload a file',
  })
  async upload(
    @UserDecorator() user: OrganizationUserDTO,
    @UploadedFiles()
    uploadedFiles: {
      files: Express.Multer.File[];
    },
  ): Promise<string[]> {
    return this.fileService.store(user, uploadedFiles.files);
  }

  @Get(':id')
  @UseGuards(AuthGuard())
  @ApiResponse({
    status: HttpStatus.OK,
    type: FileDto,
    description: 'Download a file',
  })
  @ApiNotFoundResponse({ description: `The file doesn't exist` })
  async download(
    @UserDecorator() user: OrganizationUserDTO,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.fileService.get(id, user);
    if (!file) {
      throw new NotFoundException();
    }

    res
      .set({
        'Content-Type': file.contentType,
        'Content-Length': file.data.length,
      })
      .json({
        data: file.data,
      });
  }
}
