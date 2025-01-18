import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BulkUploadEntity,
  BulkUploadStatus,
  BulkUploadType,
} from './bulk-uploads.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrganizationService } from '../organization/organization.service';
import { ILoggedInUser } from 'src/models';
import { FileService } from '../file';
import { ReadsService } from '../reads/reads.service';
import { BulkUploadFailedLogEntity } from './bulk-uploads-failed-logs.entity';
import { GetBulkUploadDTO } from './get-bulk-upload.dto';

@Injectable()
export class BulkUploadService {
  public readonly logger = new Logger(BulkUploadService.name);
  constructor(
    @InjectRepository(BulkUploadEntity)
    public readonly bulkUploadRepository: Repository<BulkUploadEntity>,
    @InjectRepository(BulkUploadFailedLogEntity)
    public readonly bulkUploadFailedLogRepository: Repository<BulkUploadFailedLogEntity>,
    private readonly organizationService: OrganizationService,
    private readonly fileService: FileService,
    private readonly readsService: ReadsService,
  ) {}

  async storeBulkUploadJob(
    fileId: string,
    user: ILoggedInUser,
    organizationId: number,
    bulkUploadType: BulkUploadType,
  ): Promise<BulkUploadEntity> {
    try {
      let jobId: string;
      const fileExists = await this.fileService.get(fileId, user);
      if (!fileExists) {
        throw new NotFoundException('File not found');
      }

      const multerFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: fileExists.filename,
        encoding: '7bit',
        mimetype: fileExists.contentType,
        buffer: fileExists.data,
        size: fileExists.data.length,
        stream: null,
        destination: '',
        filename: fileExists.filename,
        path: '',
      };
      const s3Upload = await this.fileService.upload(multerFile);

      if (bulkUploadType === 'Reads') {
        jobId = await this.readsService.bulkUploadJobProcessing(
          s3Upload.key,
          fileExists.filename,
          bulkUploadType,
        );
      } else {
        throw new BadRequestException(
          `Unsupported bulk upload type: ${bulkUploadType}`,
        );
      }

      return await this.bulkUploadRepository.save({
        fileId: fileExists.filename,
        jobId: jobId,
        organizationId: organizationId,
        status: BulkUploadStatus.Added,
        type: bulkUploadType,
      });
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw error;
    }
  }

  async getAllBulkUploads(
    organizationId: number,
    pageNumber?: number,
    limit?: number,
  ): Promise<
    | {
        csvJobs: Array<BulkUploadEntity>;
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
  > {
    this.logger.verbose(`With in getAllCSVJobsForOrganization`);
    const [csvJobs, totalCount] = await this.bulkUploadRepository.findAndCount({
      where: { organizationId },
      order: {
        createdAt: 'DESC',
      },
      skip: (pageNumber - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    const csvJobsWithOrganization = await Promise.all(
      csvJobs.map(async (csvJob: BulkUploadEntity) => {
        const organization = await this.organizationService.findOne(
          csvJob.organizationId,
        );
        csvJob.organization = {
          name: organization.name,
        };
        return csvJob;
      }),
    );

    return {
      csvJobs: csvJobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }

  async storeFailedLogsBulkUpload(
    bulkUploadId: string,
    errorDetails: string,
  ): Promise<BulkUploadFailedLogEntity> {
    this.logger.verbose(`With in createFailedRowDetailsForCSVJob`);
    return await this.bulkUploadFailedLogRepository.save({
      bulkUploadId: bulkUploadId,
      details: errorDetails,
    });
  }

  async getBulkUploadFailedLog(
    bulkUploadId: string,
  ): Promise<GetBulkUploadDTO | undefined> {
    this.logger.verbose(`With in getFailedRowDetailsForCSVJob`);
    return await this.bulkUploadFailedLogRepository.findOne({
      where: {
        bulkUploadId: bulkUploadId,
      },
    });
  }

  async getAllCSVJobsForAdmin(
    orgId?: number,
    pageNumber?: number,
    limit?: number,
  ): Promise<
    | {
        csvJobs: Array<BulkUploadEntity>;
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
  > {
    this.logger.verbose(`With in getAllCSVJobsForAdmin`);
    const whereConditions: any = {};

    if (orgId) {
      whereConditions.organizationId = orgId;
    }

    const [csvJobs, totalCount] = await this.bulkUploadRepository.findAndCount({
      where: whereConditions,
      order: {
        createdAt: 'DESC',
      },
      skip: (pageNumber - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    const csvJobsWithOrganization = await Promise.all(
      csvJobs.map(async (csvJob: BulkUploadEntity) => {
        const organization = await this.organizationService.findOne(
          csvJob.organizationId,
        );
        csvJob.organization = {
          name: organization.name,
        };
        return csvJob;
      }),
    );

    return {
      csvJobs: csvJobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }

  async getAllCSVJobsForApiUser(
    apiUserId: string,
    organizationId?: number,
    pageNumber?: number,
    limit?: number,
  ): Promise<
    | {
        csvJobs: Array<BulkUploadEntity>;
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
  > {
    this.logger.verbose(`With in getAllCSVJobsForApiUser`);
    const query: SelectQueryBuilder<BulkUploadEntity> =
      await this.bulkUploadRepository
        .createQueryBuilder('csvjobs')
        .orderBy('csvjobs.createdAt', 'DESC');

    if (apiUserId) {
      query.andWhere(`csvjobs.api_user_id = '${apiUserId}'`);
    }

    if (organizationId) {
      query.andWhere(`csvjobs.organizationId = '${organizationId}'`);
    }

    const [csvjobs, totalCount] = await query
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalCount / limit);

    const csvJobsWithOrganization = await Promise.all(
      csvjobs.map(async (csvjob: BulkUploadEntity) => {
        const organization = await this.organizationService.findOne(
          csvjob.organizationId,
        );
        csvjob.organization = {
          name: organization.name,
        };
        return csvjob;
      }),
    );

    return {
      csvJobs: csvJobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }
}
