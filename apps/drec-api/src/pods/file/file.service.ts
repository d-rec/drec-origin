import { Logger, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import path from 'path';
import { Connection, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ILoggedInUser } from '../../models';
import { Role } from '../../utils/enums';

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
    private readonly connection: Connection,
  ) {}

  public async store(
    user: ILoggedInUser,
    files: FileUpload[],
    isPublic = false,
  ): Promise<string[]> {
    if (!files || !files?.length) {
      throw new NotAcceptableException('No files added');
    }
    this.logger.debug(
      `User ${user ? JSON.stringify(user) : 'Anonymous'} requested store for ${
        files?.length
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
          organizationId: user.organizationId.toString(),
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

  private generateUniqueFilename(originalFilename: string) {
    return `${uuid()}.${path.extname(originalFilename)}`;
  }
}
