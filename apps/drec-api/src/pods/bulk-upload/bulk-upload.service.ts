import {
  BadRequestException,
  ConflictException,
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
import { DeviceGroupService } from '../device-group/device-group.service';

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
    private readonly deviceGroupService: DeviceGroupService,
  ) {}

  async storeBulkUploadJob(
    fileId: string,
    user: ILoggedInUser,
    organizationId: number,
    bulkUploadType: BulkUploadType,
  ): Promise<BulkUploadEntity> {
    try {
      const file = await this.fileService.get(fileId, user);
      if (!file) {
        throw new NotFoundException('File not found');
      }

      const multerFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: file.filename,
        encoding: '7bit',
        mimetype: file.contentType,
        buffer: file.data,
        size: file.data.length,
        stream: null,
        destination: '',
        filename: file.filename,
        path: '',
      };
      const s3Upload = await this.fileService.upload(multerFile);

      const jobId = await this.createJob(bulkUploadType, file, s3Upload);

      return await this.bulkUploadRepository.save({
        fileId: file.filename,
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

  private async createJob(
    bulkUploadType: BulkUploadType,
    file: any,
    s3Upload: any,
  ) {
    switch (bulkUploadType) {
      case BulkUploadType.Reads:
        return this.readsService.bulkUploadJobProcessing(
          s3Upload.key,
          file.filename,
          bulkUploadType,
        );
      case BulkUploadType.Devices:
        return this.deviceGroupService.bulkUploadJobProcessing(
          s3Upload.key,
          file.filename,
        );
      default:
        throw new BadRequestException(
          `Unsupported bulk upload type: ${bulkUploadType}`,
        );
    }
  }

  async getAllBulkUploadsJobsByOrganization(
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

  async getAllBulkUploadJobs(
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
      return this.getAllBulkUploadJobs(orgId, pageNumber, limit);
    }

    if (role === Role.ApiUser) {
      return this.getAllBulkUploadJobsForApiUser(
        api_user_id,
        orgId,
        pageNumber,
        limit,
      );
    }

    return this.getAllBulkUploadsJobsByOrganization(
      organizationId,
      pageNumber,
      limit,
    );
  }

  async mapJobsWithOrganization(
    jobs: BulkUploadEntity[],
  ): Promise<BulkUploadEntity[]> {
    const organizationIds = new Set(jobs.map((job) => job.organizationId));

    const organizations = await this.organizationService.findByIds(
      Array.from(organizationIds.values()),
    );

    return jobs.map((job: BulkUploadEntity) => {
      const organization = organizations.find(
        (org) => org.id === job.organizationId,
      );
      job.organization = {
        name: organization.name,
      };
      return job;
    });
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

  async canViewBulkUploadJobs({
    user,
    organizationId,
  }: {
    user: ILoggedInUser;
    organizationId?: number | string;
  }): Promise<boolean> {
    if (!user.organizationId) {
      this.logger.error(`User does not belong to any organization.`);
      throw new ConflictException({
        success: false,
        message: 'User does not belong to any organization.',
      });
    }

    if (!organizationId && user.role === Role.ApiUser) {
      this.logger.error(`Add the organizationId at query param`);
      throw new BadRequestException({
        success: false,
        message: `Add the orgId at query param`,
      });
    }

    if (organizationId) {
      await this.organizationService.checkIfCanManage({
        user,
        organizationId: Number(organizationId),
      });
    }

    return true;
  }
}
