/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { FileService } from './file.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { File } from './file.entity';

describe('FileService', () => {
  let service: FileService;
  let repository: Repository<File>;
  let connection: Connection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: getRepositoryToken(File),
          useClass: Repository,
        },
        {
          provide: Connection,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('store', () => { /*
    it('should throw NotAcceptableException if no files are provided', async () => {
      await expect(service.store({ id: '123', organizationId: '456' } as ILoggedInUser, [], false))
        .rejects.toThrow(NotAcceptableException);

      expect(mockLogger.error).toHaveBeenCalledWith('No files added');
    });

    it('should log the user and file count correctly', async () => {
      const user: ILoggedInUser = { id: '123', organizationId: '456' } as ILoggedInUser;
      const files: FileUpload[] = [
        { originalname: 'test.txt', buffer: Buffer.from('test'), mimetype: 'text/plain' },
      ];

      await service.store(user, files, false);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `User ${JSON.stringify(user)} requested store for ${files.length} files`,
      );
    });

    it('should store files in the transaction and return their IDs', async () => {
      const user: ILoggedInUser = { id: '123', organizationId: '456' } as ILoggedInUser;
      const files: FileUpload[] = [
        { originalname: 'test.txt', buffer: Buffer.from('test'), mimetype: 'text/plain' },
      ];
      const mockFileId = 'mock-file-id';
      mockEntityManager.insert.mockResolvedValue({ identifiers: [{ id: mockFileId }] });

      const result = await service.store(user, files, false);

      expect(mockConnection.transaction).toHaveBeenCalled();
      expect(mockEntityManager.insert).toHaveBeenCalledWith(File, expect.any(File));
      expect(result).toEqual([mockFileId]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `User ${JSON.stringify(user)} has stored ${JSON.stringify([mockFileId])}`,
      );
    });

    it('should handle anonymous user logging correctly', async () => {
      const files: FileUpload[] = [
        { originalname: 'test.txt', buffer: Buffer.from('test'), mimetype: 'text/plain' },
      ];

      await service.store(null, files, false);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `User Anonymous requested store for ${files.length} files`,
      );
    });*/
  });
});
