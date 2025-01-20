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
import { Repository } from 'typeorm';
import { OrganizationService } from '../organization/organization.service';
import { ILoggedInUser } from 'src/models';
import { FileService } from '../file';
import { ReadsService } from '../reads/reads.service';
import { BulkUploadFailedLogEntity } from './bulk-uploads-failed-logs.entity';
import { GetBulkUploadDTO } from './dto/get-bulk-upload.dto';
import { Role } from '../../utils/enums';

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

  async getAllBulkUploadsJobs(
    organizationId: number,
    pageNumber: number,
    limit: number,
  ): Promise<{
    bulkUploadJobs: BulkUploadEntity[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`Fetching jobs for organization ${organizationId}`);
    const [jobs, totalCount] = await this.bulkUploadRepository.findAndCount({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      skip: (pageNumber - 1) * limit,
      take: limit,
    });

    const mappedJobs = await this.mapJobsWithOrganization(jobs);
    const { currentPage, totalPages } = this.paginate(
      pageNumber,
      limit,
      totalCount,
    );

    return {
      bulkUploadJobs: mappedJobs,
      currentPage,
      totalPages,
      totalCount,
    };
  }

  async getAllBulkUploadJobsForAdmin(
    orgId: number | null,
    pageNumber: number,
    limit: number,
  ): Promise<{
    bulkUploadJobs: BulkUploadEntity[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`Fetching jobs for admin`);
    const whereConditions: any = orgId ? { organizationId: orgId } : {};

    const [jobs, totalCount] = await this.bulkUploadRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip: (pageNumber - 1) * limit,
      take: limit,
    });

    const mappedJobs = await this.mapJobsWithOrganization(jobs);
    const { currentPage, totalPages } = this.paginate(
      pageNumber,
      limit,
      totalCount,
    );

    return {
      bulkUploadJobs: mappedJobs,
      currentPage,
      totalPages,
      totalCount,
    };
  }

  async getAllBulkUploadJobsForApiUser(
    apiUserId: string,
    orgId: number | null,
    pageNumber: number,
    limit: number,
  ): Promise<{
    bulkUploadJobs: BulkUploadEntity[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`Fetching jobs for API user ${apiUserId}`);
    const query = this.bulkUploadRepository
      .createQueryBuilder('jobs')
      .where('jobs.api_user_id = :apiUserId', { apiUserId });

    if (orgId) {
      query.andWhere('jobs.organizationId = :orgId', { orgId });
    }

    const [jobs, totalCount] = await query
      .orderBy('jobs.createdAt', 'DESC')
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const mappedJobs = await this.mapJobsWithOrganization(jobs);
    const { currentPage, totalPages } = this.paginate(
      pageNumber,
      limit,
      totalCount,
    );

    return {
      bulkUploadJobs: mappedJobs,
      currentPage,
      totalPages,
      totalCount,
    };
  }

  public async getBulkUploadJobsByRole(
    user: ILoggedInUser,
    orgId: number | null,
    pageNumber: number,
    limit: number,
  ): Promise<{
    bulkUploadJobs: BulkUploadEntity[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    const { role, api_user_id, organizationId } = user;

    if (role === Role.Admin) {
      return this.getAllBulkUploadJobsForAdmin(orgId, pageNumber, limit);
    } else if (role === Role.ApiUser) {
      return this.getAllBulkUploadJobsForApiUser(
        api_user_id,
        orgId,
        pageNumber,
        limit,
      );
    } else {
      return this.getAllBulkUploadsJobs(organizationId, pageNumber, limit);
    }
  }

  async mapJobsWithOrganization(
    jobs: BulkUploadEntity[],
  ): Promise<BulkUploadEntity[]> {
    return Promise.all(
      jobs.map(async (job: BulkUploadEntity) => {
        const organization = await this.organizationService.findOne(
          job.organizationId,
        );
        job.organization = {
          name: organization.name,
        };
        return job;
      }),
    );
  }

  paginate(
    pageNumber: number,
    limit: number,
    totalCount: number,
  ): { currentPage: number; totalPages: number } {
    const totalPages = Math.ceil(totalCount / limit);
    return { currentPage: pageNumber, totalPages };
  }

  async storeFailedLogBulkUpload(
    bulkUploadId: string,
    errorDetails: string,
  ): Promise<BulkUploadFailedLogEntity> {
    this.logger.verbose(`With in storeFailedBulkUploadJob`);
    return await this.bulkUploadFailedLogRepository.save({
      bulkUploadId: bulkUploadId,
      details: errorDetails,
    });
  }

  async getBulkUploadFailedLog(
    bulkUploadId: string,
  ): Promise<GetBulkUploadDTO | undefined> {
    this.logger.verbose(`With in getFailedBulkUploadJob`);
    return await this.bulkUploadFailedLogRepository.findOne({
      where: {
        bulkUploadId: bulkUploadId,
      },
    });
  }
}
