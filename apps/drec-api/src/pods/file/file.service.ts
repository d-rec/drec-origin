import { Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
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
  ) { }

  public async store(
    user: ILoggedInUser,
    files: FileUpload[],
    isPublic = false,
  ): Promise<string[]> {
    if (!files || !files.length) {
      throw new NotAcceptableException('No files added');
    }
    this.logger.debug(
      `User ${user ? JSON.stringify(user) : 'Anonymous'} requested store for ${files.length
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
      `User ${user ? JSON.stringify(user) : 'Anonymous'
      } has stored ${JSON.stringify(storedFile)}`,
    );

    return storedFile;
  }

  public async get(
    id: string,
    user?: ILoggedInUser,
  ): Promise<File | undefined> {
    this.logger.debug(
      `User ${user ? JSON.stringify(user) : 'Anonymous'} requested file ${id}`,
    );
    if (user) {
      if (user.role === Role.Admin) {
        return this.repository.findOne(id);
      }

      return this.repository.findOne(id, {
        where: {
          userId: user.id.toString(),
          organizationId: user.organizationId?.toString(),
        },
      });
    }
    return this.repository.findOne(id, {
      where: {
        isPublic: true,
      },
    });
  }

  public async assignFilesToUser(
    user: LoggedInUser,
    fileIds: string[],
  ): Promise<void> {
    if (!user.hasOrganization) {
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
    console.log(file);
    const { originalname } = file;
    const bucketS3 = process.env.bucketname;
    const result = await this.uploadS3(file.buffer, bucketS3, originalname);
    console.log(result);
    return result
  }

  async uploadS3(file, bucket, name) {
    const s3 = this.getS3();
    console.log(`${uuid()}-${String(name)}`)
    let a= name.substr(0,name.indexOf(".csv"))
    console.log(a);
    const params = {
      Bucket: bucket,
      Key: `${a}-${uuid()}.csv`,
      Body: file,
      ACL: 'public-read'
    };
    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          Logger.error(err);
          reject(err.message);
        }
        console.log(data)
        resolve(data
        );
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
    console.log(key);

    const s3 = this.getS3();

    // const fileInfo = await this.privateFilesRepository.findOne({ id: fileId }, { relations: ['owner'] });
    if (key) {
      console.log(key);
      let response: any;
      return new Promise((resolve, reject) => {
        s3.getObject(
          { Bucket: process.env.bucketname, Key: key }, (err, data) => {

            if (err) {
              Logger.error(err);
              reject(err.message);
            }
            console.log(data)
            resolve({
              data,
              filename: key
            }
            );
          })
      });
      // function (error, data) {
      //   if (error != null) {
      //     console.log(error);
      //     // alert("Failed to retrieve an object: " + error);
      //   } else {
      //    console.log(data);
      //     response= {
      //     data,
      //     filename: key
      //   };
      //     return response
      //     // alert("Loaded " + data.ContentLength + " bytes");
      //   }
      // }
      // (err, data) => {
      //   if (err) {
      //     Logger.error(err);
      //     reject(err.message);
      //   }
      //   console.log(data)
      //   resolve(data
      //   );
      //);
      //});


      // return response;
    }
    throw new NotFoundException();
  }
}
