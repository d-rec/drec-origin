import { Logger, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import path from 'path';
import { Connection, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { OrganizationUserDTO } from '../../auth/dto/org-user.dto';
import { Role } from '../../utils/eums';

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
    user: OrganizationUserDTO,
    files: FileUpload[],
    isPublic = false,
  ): Promise<string[]> {
    if (!files || !files?.length) {
      throw new NotAcceptableException('No files added');
    }
    this.logger.debug(
      `User ${JSON.stringify(user)} requested store for ${files?.length} files`,
    );

    const storedFile: string[] = [];
    await this.connection.transaction(async (entityManager) => {
      for (const file of files) {
        const fileToStore = new File({
          filename: this.generateUniqueFilename(file.originalname),
          data: file.buffer,
          contentType: file.mimetype,
          userId: user.id.toString(),
          organizationId: user.organization.id?.toString(),
          isPublic,
        });
        await entityManager.insert<File>(File, fileToStore);

        storedFile.push(fileToStore.id);
      }
    });
    this.logger.debug(
      `User ${JSON.stringify(user)} has stored ${JSON.stringify(storedFile)}`,
    );

    return storedFile;
  }

  public async get(
    id: string,
    user: OrganizationUserDTO,
  ): Promise<File | undefined> {
    this.logger.debug(`User ${JSON.stringify(user)} requested file ${id}`);

    if (user.role === Role.Admin) {
      return this.repository.findOne(id);
    }

    return this.repository.findOne(id, {
      where: {
        userId: user.id.toString(),
        organizationId: user.organization.id?.toString(),
      },
    });
  }

  private generateUniqueFilename(originalFilename: string) {
    return `${uuid()}.${path.extname(originalFilename)}`;
  }
}
