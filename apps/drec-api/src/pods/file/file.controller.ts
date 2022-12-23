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
  Body,
  UploadedFile,
  ConflictException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
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
//import { DeviceCsvFileProcessingJobsEntity, StatusCSV } from '../device-group/device_csv_processing_jobs.entity';
//import { DeviceGroupService } from '../device-group/device-group.service';

const maxFilesLimit = parseInt(process.env.FILE_MAX_FILES!, 10) || 20;
const maxFileSize = parseInt(process.env.FILE_MAX_FILE_SIZE!, 10) || 10485760;

const supportedFiles = FILE_SUPPORTED_MIMETYPES;
supportedFiles.push('text/csv');
supportedFiles.push('image/jpeg');
supportedFiles.push('image/png');


@ApiTags('file')
@ApiBearerAuth('access-token')
@Controller('file')
export class FileController {
  //constructor(private deviceGroupService:DeviceGroupService,private readonly fileService: FileService) {}
  constructor(private readonly fileService: FileService) { }

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
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [String],
    description: 'Upload a file',
  })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   type: [DeviceCsvFileProcessingJobsEntity],
  //   description: 'Returns job status for csv processing',
  // })
  async upload(
    @UserDecorator() user: ILoggedInUser,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @UploadedFiles()
    uploadedFiles: {
      files: Express.Multer.File[];
    },
    @Body() fileUploadDto: FileUploadDto,
  ): Promise<string[]> {
    // if(fileUploadDto.type!==undefined && fileUploadDto.type!==null && fileUploadDto.type==='csvDeviceBulkRegistration')
    // {
    //   let fileId = await this.fileService.store(user, uploadedFiles.files);
    //   let response =  await this.fileService.get(fileId[0],user);
    //   let jobCreated=await this.fileService.createCSVJobForFile(user.id,organizationId,StatusCSV.Added,response instanceof File? response.id:'');
    //   //@ts-ignore
    //   return jobCreated;
    // }
    console.log(uploadedFiles.files);
    return this.fileService.store(user, uploadedFiles.files);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
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
    const file = await this.fileService.get(id, user);
    if (!file) {
      throw new NotFoundException();
    }

    res
      .set({
        'Content-Type': file.contentType,
        'Content-Length': file.data.length,
      })
      .send(file.data);
  }

  @Get('/public/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: FileDto,
    description: 'Download a file anonymously',
  })
  @ApiNotFoundResponse({ description: `The file doesn't exist` })
  async downloadAnonymously(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.fileService.get(id);
    if (!file) {
      throw new NotFoundException();
    }

    res
      .set({
        'Content-Type': file.contentType,
        'Content-Length': file.data.length,
      })
      .send(file.data);
  }

  @Post('/public')
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
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [String],
    description: 'Upload a file',
  })
  async uploadAnonymously(
    @UserDecorator() user: ILoggedInUser,
    @UploadedFiles()
    uploadedFiles: {
      files: Express.Multer.File[];
    },
  ): Promise<string[]> {
    return this.fileService.store(user, uploadedFiles.files, true);
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploads(@UploadedFile() file) {
    console.log(file)
    if (!supportedFiles.includes(file.mimetype)) {
     // throw new Error('Unsupported file type');
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false, 
            message: 'Unsupported file type',
          }),
        );
      });
    }
    return await this.fileService.upload(file);
  }
}
