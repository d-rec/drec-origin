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
import { In, Repository } from 'typeorm';
import { OrganizationService } from '../organization/organization.service';
import { ILoggedInUser } from '../../models';
import { FileService } from '../file';
import { ReadsService } from '../reads/reads.service';
import { BulkUploadFailedLogEntity } from './bulk-uploads-failed-logs.entity';
import { GetBulkUploadDTO } from './dto/get-bulk-upload.dto';
import { Role } from '../../utils/enums';
import { DeviceGroupService } from '../device-group/device-group.service';
import { Organization } from '../organization/organization.entity';

@Injectable()
export class BulkUploadService {
  public readonly logger = new Logger(BulkUploadService.name);
  constructor(
    @InjectRepository(BulkUploadEntity)
    public readonly bulkUploadRepository: Repository<BulkUploadEntity>,
    @InjectRepository(BulkUploadFailedLogEntity)
    public readonly bulkUploadFailedLogRepository: Repository<BulkUploadFailedLogEntity>,
    @InjectRepository(Organization)
    public readonly organizationRepository: Repository<Organization>,
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

  async getBulkUploadJobs({
    bulkUploadType,
    pageNumber,
    limit,
    organizationIds,
  }: {
    bulkUploadType: BulkUploadType;
    pageNumber: number;
    limit: number;
    organizationIds?: number[];
  }): Promise<{
    bulkUploadJobs: BulkUploadEntity[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`Fetching jobs for admin`);
    const whereConditions: any = {
      type: bulkUploadType,
    };

    if (organizationIds?.length) {
      whereConditions.organizationId = In(organizationIds);
    }

    const [jobs, totalCount] = await this.bulkUploadRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      skip: (pageNumber - 1) * limit,
      take: limit,
      relations: ['organization'],
    });

    const { currentPage, totalPages } = this.paginate(
      pageNumber,
      limit,
      totalCount,
    );

    return {
      bulkUploadJobs: jobs,
      currentPage,
      totalPages,
      totalCount,
    };
  }

  async getAllBulkUploadJobsForApiUser({
    apiUserId,
    bulkUploadType,
    pageNumber,
    limit,
  }: {
    apiUserId: string;
    bulkUploadType: BulkUploadType;
    pageNumber: number;
    limit: number;
  }): Promise<{
    bulkUploadJobs: BulkUploadEntity[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    const organizations = await this.organizationRepository
      .createQueryBuilder('organization')
      .select('organization.id')
      .where('organization.api_user_id = :apiUserId', { apiUserId })
      .getMany();

    const organizationIds = organizations.map((org) => org.id);

    return this.getBulkUploadJobs({
      bulkUploadType,
      pageNumber,
      limit,
      organizationIds,
    });
  }

  public async getBulkUploadJobsByRole(
    user: ILoggedInUser,
    bulkUploadType: BulkUploadType,
    pageNumber: number,
    limit: number,
  ): Promise<{
    bulkUploadJobs: BulkUploadEntity[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    const { role, api_user_id, organizationId } = user;

    switch (role) {
      case Role.Admin:
        return this.getBulkUploadJobs({
          bulkUploadType,
          pageNumber,
          limit,
        });

      case Role.ApiUser:
        return this.getAllBulkUploadJobsForApiUser({
          apiUserId: api_user_id,
          bulkUploadType,
          pageNumber,
          limit,
        });

      default:
        return this.getBulkUploadJobs({
          bulkUploadType,
          pageNumber,
          limit,
          organizationIds: [organizationId],
        });
    }
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

  async canManageBulkUploadJobs({
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
