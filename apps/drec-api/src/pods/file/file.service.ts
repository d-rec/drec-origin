import {
  Logger,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import path from 'path';
import { Connection, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ILoggedInUser, LoggedInUser } from '../../models';
import { Role } from '../../utils/enums';
import { S3 } from 'aws-sdk';

//import { DeviceCsvFileProcessingJobsEntity, StatusCSV } from '../device-group/device_csv_processing_jobs.entity';

import { File } from './file.entity';

export type FileUpload = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
};

export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(File) private readonly repository: Repository<File>,
    // @InjectRepository(DeviceCsvFileProcessingJobsEntity)
    // private readonly repositoyCSVJobProcessing: Repository<DeviceCsvFileProcessingJobsEntity>,
    private readonly connection: Connection,
  ) {}

  public async store(
    user: ILoggedInUser,
    files: FileUpload[],
    isPublic = false,
  ): Promise<string[]> {
    this.logger.verbose(`With in store`);
    if (!files || !files.length) {
      this.logger.error(`No files added`);
      throw new NotAcceptableException('No files added');
    }
    this.logger.debug(
      `User ${user ? JSON.stringify(user) : 'Anonymous'} requested store for ${
        files.length
      } files`,
    );

    const storedFile: string[] = [];
    await this.connection.transaction(async (entityManager) => {
      for (const file of files) {
        const fileToStore = new File({
          filename: this.generateUniqueFilename(file.originalname),
          data: file.buffer,
          contentType: file.mimetype,
          userId: user.id.toString(),
          organizationId: user.organizationId?.toString(),
          isPublic,
        });
        await entityManager.insert<File>(File, fileToStore);

        storedFile.push(fileToStore.id);
      }
    });
    this.logger.debug(
      `User ${
        user ? JSON.stringify(user) : 'Anonymous'
      } has stored ${JSON.stringify(storedFile)}`,
    );

    return storedFile;
  }

  public async get(
    id: string,
    user?: ILoggedInUser,
  ): Promise<File | undefined> {
    this.logger.verbose(`With in get`);
    this.logger.debug(
      `User ${user ? JSON.stringify(user) : 'Anonymous'} requested file ${id}`,
    );
    if (user) {
      if (user.role === Role.Admin) {
        return this.repository.findOne({
          where: {
            id: id,
          },
        });
      }

      return this.repository.findOne({
        where: {
          id: id,
          userId: user.id.toString(),
          organizationId: user.organizationId?.toString(),
        },
      });
    }
    return this.repository.findOne({
      where: {
        id: id,
        isPublic: true,
      },
    });
  }

  public async assignFilesToUser(
    user: LoggedInUser,
    fileIds: string[],
  ): Promise<void> {
    this.logger.verbose(`With in assignFilesToUser`);
    if (!user.hasOrganization) {
      this.logger.error(`User is not part of the organization`);
      throw new Error('User is not part of the organization');
    }

    await this.connection.transaction(async (entityManager) => {
      for (const id of fileIds) {
        await entityManager.update<File>(
          File,
          { id, userId: user.id.toString() },
          { organizationId: user.organizationId.toString() },
        );
      }
    });
  }

  public async isOwner(
    user: LoggedInUser,
    fileIds: string[],
  ): Promise<boolean> {
    this.logger.verbose(`With in isOwner`);
    this.logger.debug(
      `User ${JSON.stringify(
        user,
      )} requested ownership check for ${JSON.stringify(fileIds)}`,
    );

    let isOwner = true;

    for (const documentId of fileIds) {
      const hasOrganization = user.organizationId && user.organizationId > 0;

      const where = hasOrganization
        ? {
            id: documentId,
            userId: user.id.toString(),
            organizationId: user.organizationId.toString(),
          }
        : {
            id: documentId,
            userId: user.id.toString(),
          };

      const count = await this.repository.count({ where });

      this.logger.debug(
        `Found ${count} documents matching documen ID ${documentId}, user ID ${user.id} and org ID ${user.organizationId}`,
      );

      if (count == 0) {
        isOwner = false;
        break;
      }
    }

    this.logger.debug(
      `User ${JSON.stringify(user)} ownership for ${JSON.stringify(
        fileIds,
      )} returns ${isOwner}}`,
    );

    return isOwner;
  }

  private generateUniqueFilename(originalFilename: string) {
    this.logger.verbose(`With in generateUniqueFilename`);
    return `${uuid()}.${path.extname(originalFilename)}`;
  }

  // async createCSVJobForFile(
  //   userId: number,
  //   organizationId: number,
  //   status: StatusCSV,
  //   fileId: string,
  // ): Promise<DeviceCsvFileProcessingJobsEntity> {
  //   return await this.repositoyCSVJobProcessing.save({
  //     userId,
  //     organizationId,
  //     status,
  //     fileId,
  //   });
  // }

  async upload(file) {
    this.logger.verbose(`With in upload`);
    this.logger.debug(file);
    const { originalname } = file;
    const bucketS3 = process.env.bucketname;
    const result = await this.uploadS3(file.buffer, bucketS3, originalname);
    return result;
  }

  async uploadS3(file, bucket, name) {
    this.logger.verbose(`With in uploadS3`);
    const s3 = this.getS3();
    this.logger.debug(`${uuid()}-${String(name)}`);
    const a = name.substr(0, name.indexOf('.csv'));
    this.logger.debug(a);
    const params = {
      Bucket: bucket,
      Key: `${a}-${uuid()}.csv`,
      Body: file,
      ACL: 'public-read',
    };
    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          this.logger.error(err);
          reject(err.message);
        }
        resolve(data);
      });
    });
  }

  getS3() {
    return new S3({
      accessKeyId: process.env.accessKeyId,
      secretAccessKey: process.env.secretAccessKey,
    });
  }

  public async GetuploadS3(key: string) {
    this.logger.verbose(`With in GetuploadS3`);
    const s3 = this.getS3();

    // const fileInfo = await this.privateFilesRepository.findOne({ id: fileId }, { relations: ['owner'] });
    if (key) {
      this.logger.debug(key);
      let response: any;
      return new Promise((resolve, reject) => {
        s3.getObject(
          { Bucket: process.env.bucketname, Key: key },
          (err, data) => {
            if (err) {
              this.logger.error(err);
              reject(err.message);
            }
            resolve({
              data,
              filename: key,
            });
          },
        );
      });
    }
    this.logger.error(`Object not found`);
    throw new NotFoundException();
  }

  // public async getPrivateFile(key: string) {
  //   const s3 = this.getS3();
  // if (key) {

  //     return s3.getSignedUrlPromise('getObject', {
  //       Bucket: process.env.bucketname,
  //       Key: key
  //     })
  //   }
  //   throw new NotFoundException();
  // }
}
