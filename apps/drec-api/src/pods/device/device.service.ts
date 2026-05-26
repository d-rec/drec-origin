import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import cleanDeep from 'clean-deep';
import { DateTime } from 'luxon';
import {
  Between,
  Brackets,
  DataSource,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  FindOperator,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Raw,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { v4 as uuid } from 'uuid';
import {
  getCycleEndDate,
  getMaxDateByFrequency,
  getMinDateByFrequency,
} from '../../lib/helpers/getCycleEndDate';
import { Profile } from '../../lib/profile';
import {
  DeviceKey,
  DeviceSortPropertyMapper,
  IREC_DEVICE_TYPES,
  IREC_FUEL_TYPES,
} from '../../models';
import { SDGBenefits } from '../../models/Sdgbenefit';
import {
  CertificateGenerationFrequency,
  DeviceOrderBy,
  ReadType,
  Role,
} from '../../utils/enums';
import { getCapacityRange } from '../../utils/get-capacity-range';
import { getDateRangeFromYear } from '../../utils/get-commissioning-date-range';
import { getCodeFromCountry } from '../../utils/getCodeFromCountry';
import { getDeviceTypeFromCode } from '../../utils/getDeviceTypeFromCode';
import { getFuelNameFromCode } from '../../utils/getFuelNameFromCode';
import { groupByProps } from '../../utils/group-by-properties';
import { getLocalTimeZoneFromDevice } from '../../utils/localTimeDetailsForDevice';
import { DeviceGroup } from '../device-group/device-group.entity';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { ReadsService } from '../reads/reads.service';
import { UserService } from '../user/user.service';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { Device } from './device.entity';
import { DeviceLateOngoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';
import {
  DeviceDTO,
  FilterDTO,
  GroupedDevicesDTO,
  UngroupedDeviceDTO,
  UpdateDeviceDTO,
} from './dto';
import { CodeNameDTO } from './dto/code-name.dto';
import { DeviceGroupByDTO } from './dto/device-group-by.dto';
import { NewDeviceDTO } from './dto/new-device.dto';
import {
  DocumentTargetType,
  DocumentType,
} from '../document-uploads/entities/documents.entity';
import { generateDeviceFingerprint } from '../../lib/device';
import { DocumentUploadsService } from '../document-uploads/document-uploads.service';
import { EvidentDeviceService } from '../evident/evident-device.service';
import {
  DeviceGroupCertificatesAggregate,
  EvidentIssuanceStatus,
  EvidentRegistrationStatus,
} from '../../types/evident';
import { MailService } from '../../mail/mail.service';
import EvidentDeviceApprovedTemplate, {
  getEvidentDeviceApprovedSubject,
} from '../evident/mail/evident-device-approved.template';
import EvidentDeviceRejectedTemplate, {
  getEvidentDeviceRejectedSubject,
} from '../evident/mail/evident-device-rejected.template';
import { SMALL_DEVICES_MAX_CAPACITY, LIMIT_PER_PAGE } from '../../constants';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    @InjectRepository(Device) private readonly repository: Repository<Device>,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly checkDeviceLogCertificateRepository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    @InjectRepository(DeviceLateOngoingIssueCertificateEntity)
    private readonly lateDeviceCertificateRepository: Repository<DeviceLateOngoingIssueCertificateEntity>,
    private readonly connection: DataSource,
    private readonly documentsService: DocumentUploadsService,
    private readonly evidentDeviceService: EvidentDeviceService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => ReadsService))
    private readonly readsService: ReadsService,
  ) {}

  getConnection(): DataSource {
    return this.connection;
  }

  /** Return the set of device IDs that have an approved review submission. */
  async getApprovedDeviceIds(): Promise<Set<number>> {
    const rows: { id: number }[] = await this.connection.query(
      `SELECT d.id FROM device d
       INNER JOIN submissions s
         ON regexp_replace(lower(d."siteName"), '[^a-z0-9]+', '-', 'g')
          = regexp_replace(s.project_subfolder,
              '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
              '', 'i')
       WHERE s.status = 'approved'`,
    );
    return new Set(rows.map((r) => r.id));
  }

  /**
   * Screen a device for potential duplicates across all organizations.
   * Checks: coordinate proximity (< 100m), serial number match, fingerprint match.
   */
  async screenForDuplicates(
    deviceId: number,
  ): Promise<{
    duplicates: Array<{
      id: number;
      externalId: string;
      siteName: string;
      serialNumber: string;
      organizationId: number;
      matchType: string;
    }>;
  }> {
    const device = await this.findOne(deviceId);
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    const duplicates: Array<{
      id: number;
      externalId: string;
      siteName: string;
      serialNumber: string;
      organizationId: number;
      matchType: string;
    }> = [];

    // 1. Coordinate proximity check (~100m using Haversine approximation)
    if (device.latitude && device.longitude) {
      const nearbyDevices: Array<{
        id: number;
        externalId: string;
        siteName: string;
        serialNumber: string;
        organizationId: number;
        distance_m: number;
      }> = await this.connection.query(
        `SELECT id, "externalId", "siteName", "serialNumber", "organizationId",
                (6371000 * acos(
                  cos(radians($1)) * cos(radians(CAST(latitude AS double precision)))
                  * cos(radians(CAST(longitude AS double precision)) - radians($2))
                  + sin(radians($1)) * sin(radians(CAST(latitude AS double precision)))
                )) AS distance_m
         FROM device
         WHERE id != $3
           AND latitude IS NOT NULL
           AND longitude IS NOT NULL
         HAVING (6371000 * acos(
                  cos(radians($1)) * cos(radians(CAST(latitude AS double precision)))
                  * cos(radians(CAST(longitude AS double precision)) - radians($2))
                  + sin(radians($1)) * sin(radians(CAST(latitude AS double precision)))
                )) < 100
         ORDER BY distance_m
         LIMIT 10`,
        [device.latitude, device.longitude, device.id],
      );
      nearbyDevices.forEach((d) =>
        duplicates.push({ ...d, matchType: `coordinates (${Math.round(d.distance_m)}m)` }),
      );
    }

    // 2. Cross-org serial number match
    if (device.serialNumber) {
      const serialMatches = await this.repository.find({
        where: {
          serialNumber: device.serialNumber,
          id: Not(device.id),
        },
        select: ['id', 'externalId', 'siteName', 'serialNumber', 'organizationId'],
      });
      serialMatches.forEach((d) => {
        if (!duplicates.find((dup) => dup.id === d.id)) {
          duplicates.push({
            id: d.id,
            externalId: d.externalId,
            siteName: d.siteName,
            serialNumber: d.serialNumber,
            organizationId: d.organizationId,
            matchType: 'serial number',
          });
        }
      });
    }

    // 3. Fingerprint match (exact duplicate)
    if (device.fingerprint) {
      const fpMatches = await this.repository.find({
        where: {
          fingerprint: device.fingerprint,
          id: Not(device.id),
        },
        select: ['id', 'externalId', 'siteName', 'serialNumber', 'organizationId'],
      });
      fpMatches.forEach((d) => {
        if (!duplicates.find((dup) => dup.id === d.id)) {
          duplicates.push({
            id: d.id,
            externalId: d.externalId,
            siteName: d.siteName,
            serialNumber: d.serialNumber,
            organizationId: d.organizationId,
            matchType: 'fingerprint',
          });
        }
      });
    }

    return { duplicates };
  }

  public async find(
    filterDto: FilterDTO,
    pageNumber: number,
    OrgId?: number,
  ): Promise<{ devices: Device[]; currentPage; totalPages; totalCount }> {
    this.logger.verbose(`With in find`);
    const limit = LIMIT_PER_PAGE;
    let query = await this.getFilteredQuery(filterDto, OrgId);

    // Special path: sort by computed lastUsedAt requires aggregating
    // across upload_log / meter_reads / verification_reports first.
    if (filterDto?.sortBy === 'lastUsedAt') {
      const skip = pageNumber ? (pageNumber - 1) * limit : 0;
      const take = pageNumber ? limit : Number.MAX_SAFE_INTEGER;
      const { ids, totalCount } = await this.getDeviceIdsByLastUsed(
        (query.where as FindOptionsWhere<Device>) || {},
        filterDto.sortOrder === 'ASC' ? 'ASC' : 'DESC',
        skip,
        take,
      );
      const devicesUnordered = ids.length
        ? await this.repository.find({
            where: { id: In(ids) },
            relations: ['organization'],
          })
        : [];
      const indexById = new Map(ids.map((id, i) => [id, i]));
      const ordered = devicesUnordered.sort(
        (a, b) => (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0),
      );
      const newDevices: any[] = [];
      ordered.forEach((d: Device) => {
        (d as any)['organizationname'] = d.organization?.name;
        delete (d as any)['organization'];
        newDevices.push(d);
      });
      await this.attachReviewStatus(newDevices);
      await this.attachLastUsed(newDevices);
      return {
        devices: newDevices,
        currentPage: pageNumber ?? 1,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      };
    }

    if (pageNumber) {
      query = {
        ...query,
        skip: (pageNumber - 1) * limit,
        take: limit,
      };
    }

    const [devices, totalCount] = await this.repository.findAndCount({
      relations: ['organization'],
      ...query,
    });
    const totalPages = Math.ceil(totalCount / LIMIT_PER_PAGE);
    const currentPage = pageNumber;
    const newDevices = [];

    await devices.map((device: Device) => {
      device['organizationname'] = device.organization.name;
      delete device['organization'];
      newDevices.push(device);
    });

    await this.attachReviewStatus(newDevices);
    await this.attachLastUsed(newDevices);

    return {
      devices: newDevices,
      currentPage,
      totalPages,
      totalCount,
    };
  }

  async getOrganizationDevices(
    organizationId: number,
    api_user_id: string,
    role: Role,
    filterDto: FilterDTO,
    pageNumber: number,
  ): Promise<any> {
    this.logger.verbose(`With in getOrganizationDevices`);
    if (
      Object.keys(filterDto).length != 0 &&
      (pageNumber != null || pageNumber != undefined)
    ) {
      const query = await this.getFilteredQuery(filterDto);
      let where: any = query.where;
      if (role == Role.Registrant) {
        if (filterDto.organizationId) {
          where = { ...where, organizationId };
        } else {
          where = { ...where, api_user_id };
        }
      } else {
        where = { ...where, organizationId };
      }

      query.where = where;
      // My Devices view has no per-page limit — return all matching devices.
      const [devices, totalCount] = await this.repository.findAndCount({
        ...query,
        order: {
          createdAt: 'DESC',
        },
      });

      const totalPages = 1;
      const currentPage = 1;
      const newDevices = [];
      await devices.map((device: Device) => {
        delete device['operatorExternalId'];

        delete device['organization'];

        newDevices.push(device);
      });
      await this.attachReviewStatus(newDevices);
      return {
        devices: newDevices,
        currentPage,
        totalPages,
        totalCount,
      };
    }
    const [devices] = await this.repository.findAndCount({
      where: { organizationId },
      order: {
        createdAt: 'DESC',
      },
    });

    const newDevices = [];
    await devices.map((device: Device) => {
      delete device['organization'];
      newDevices.push(device);
    });

    await this.attachReviewStatus(newDevices);
    return newDevices;
  }

  /**
   * Attaches lastUsedAt to each device — the most recent timestamp across
   * upload_log entries, meter reads, and verification reports for that device.
   * Devices with no activity get lastUsedAt = null.
   */
  private async attachLastUsed(devices: any[]): Promise<void> {
    if (!devices.length) return;
    const ids = devices.map((d) => d.id);
    const externalIds = devices
      .map((d) => d.externalId)
      .filter((x): x is string => !!x);
    const rows: { device_id: number; last_used_at: Date | null }[] =
      await this.connection.query(
        `WITH activity AS (
           SELECT device_id, MAX(created_at) AS ts
             FROM upload_log
            WHERE device_id = ANY($1::int[])
            GROUP BY device_id
           UNION ALL
           SELECT device_id, MAX(created_at) AS ts
             FROM verification_reports
            WHERE device_id = ANY($1::int[])
            GROUP BY device_id
           UNION ALL
           SELECT d.id AS device_id, MAX(mr.created_at) AS ts
             FROM device d
             JOIN meter_reads mr ON mr.external_id = d."externalId"
            WHERE d.id = ANY($1::int[]) AND d."externalId" = ANY($2::text[])
            GROUP BY d.id
         )
         SELECT device_id, MAX(ts) AS last_used_at
           FROM activity
          GROUP BY device_id`,
        [ids, externalIds.length ? externalIds : ['']],
      );
    const map: Record<number, Date | null> = {};
    for (const r of rows) map[r.device_id] = r.last_used_at;
    for (const device of devices) {
      device.lastUsedAt = map[device.id] ?? null;
    }
  }

  /**
   * Returns device IDs ordered by lastUsedAt for paginated admin sort.
   * NULL lastUsedAt sorts last for DESC, first for ASC (default Postgres).
   */
  private async getDeviceIdsByLastUsed(
    where: FindOptionsWhere<Device>,
    sortOrder: 'ASC' | 'DESC',
    skip: number,
    take: number,
  ): Promise<{ ids: number[]; totalCount: number }> {
    const all = await this.repository.find({ where, select: ['id', 'externalId'] });
    if (!all.length) return { ids: [], totalCount: 0 };
    const idList = all.map((d) => d.id);
    const extList = all
      .map((d) => d.externalId)
      .filter((x): x is string => !!x);
    const rows: { device_id: number; last_used_at: Date | null }[] =
      await this.connection.query(
        `WITH activity AS (
           SELECT device_id, MAX(created_at) AS ts FROM upload_log
            WHERE device_id = ANY($1::int[]) GROUP BY device_id
           UNION ALL
           SELECT device_id, MAX(created_at) AS ts FROM verification_reports
            WHERE device_id = ANY($1::int[]) GROUP BY device_id
           UNION ALL
           SELECT d.id, MAX(mr.created_at) FROM device d
             JOIN meter_reads mr ON mr.external_id = d."externalId"
            WHERE d.id = ANY($1::int[]) AND d."externalId" = ANY($2::text[])
            GROUP BY d.id
         )
         SELECT d.id AS device_id, MAX(a.ts) AS last_used_at
           FROM device d
      LEFT JOIN activity a ON a.device_id = d.id
          WHERE d.id = ANY($1::int[])
          GROUP BY d.id
          ORDER BY last_used_at ${sortOrder === 'ASC' ? 'ASC NULLS FIRST' : 'DESC NULLS LAST'}, d.id DESC`,
        [idList, extList.length ? extList : ['']],
      );
    const totalCount = rows.length;
    const page = rows.slice(skip, skip + take).map((r) => r.device_id);
    return { ids: page, totalCount };
  }

  private async attachReviewStatus(devices: any[]): Promise<void> {
    if (!devices.length) return;
    const ids = devices.map((d) => d.id);
    const rows: any[] = await this.connection.query(
      `SELECT
         d.id AS device_id,
         s.status AS review_status
       FROM device d
       LEFT JOIN submissions s
         ON regexp_replace(lower(d."siteName"), '[^a-z0-9]+', '-', 'g')
          = regexp_replace(s.project_subfolder,
              '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
              '', 'i')
       WHERE d.id = ANY($1::int[])`,
      [ids],
    );
    const statusMap: Record<number, string> = {};
    for (const r of rows) {
      statusMap[r.device_id] = r.review_status ?? 'pending';
    }
    for (const device of devices) {
      const fallback = device.IREC_Status === 'Legacy' ? 'legacy' : 'pending';
      device.reviewStatus = statusMap[device.id] ?? fallback;
    }
  }

  public getLatestDeviceByOrganization(
    organizationId: number,
  ): Promise<Device[]> {
    this.logger.verbose(`With in getLatestDeviceByOrganization`);
    const result = this.repository.find({
      where: { organizationId },
      order: {
        id: 'DESC',
      },
      take: 1,
    });
    delete result['organization'];
    return result;
  }

  public async findForDevicesWithDeviceIdAndOrganizationId(
    deviceIds: Array<number>,
    organizationId: number,
  ): Promise<Device[]> {
    this.logger.verbose(`With in findForDevicesWithDeviceIdAndOrganizationId`);
    const result = this.repository.find({
      where: { id: In(deviceIds), organizationId },
    });

    delete result['organization'];
    return result;
  }

  public async findForGroup(groupId: number): Promise<Device[]> {
    this.logger.verbose(`With in findForGroup`);
    const result = await this.repository.find({
      where: { groupId },
      order: {
        createdAt: 'DESC',
      },
    });
    delete result['organization'];
    return result;
  }

  public async newFindForGroup(
    groupId: number,
  ): Promise<{ [key: string]: Device[] }> {
    this.logger.verbose(`With in NewfindForGroup`);
    let groupDevice: Array<any> = await this.repository.find({
      where: { groupId },
      order: {
        createdAt: 'DESC',
      },
    });
    groupDevice = groupDevice.filter(
      (ele) =>
        ele.meterReadtype == ReadType.Delta ||
        ele.meterReadtype == ReadType.Aggregate,
    );

    const deviceGroupedByCountry = this.groupBy(groupDevice, 'countryCode');
    return deviceGroupedByCountry ?? null;
  }

  private groupBy(array: any, key: any): Promise<{ [key: string]: Device[] }> {
    this.logger.verbose(`With in groupBy`);
    return array.reduce((result: any, currentValue: any) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(
        currentValue,
      );

      return result;
    }, {});
  }

  public async findByIds(ids: number[]): Promise<Device[]> {
    this.logger.verbose(`With in findByIds`);
    const result = await this.repository.findByIds(ids);
    delete result['organization'];
    return result;
  }

  public async findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation(
    ids: number[],
  ): Promise<Device[]> {
    this.logger.verbose(
      `With in findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation`,
    );
    const result = await this.repository.find({
      where: {
        id: In(ids),
      },
    });
    delete result['organization'];
    return result;
  }

  async checkSiteNameExists(siteName: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { siteName },
    });
    return count > 0;
  }

  async findOne(
    id: number,
    options?: FindOneOptions<Device>,
  ): Promise<Device | null> {
    this.logger.verbose(`With in findOne`);
    const device: Device = await this.repository.findOne({
      where: {
        id: id,
        ...options,
      },
    });
    if (!device) {
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(
      device.createdAt,
      device,
    );

    delete device['organization'];
    return device;
  }

  @Profile()
  async findReads(meterId: string): Promise<Device | null> {
    this.logger.verbose(`With in findReads`);
    const result = await this.repository.findOne({
      where: { externalId: meterId },
    });
    if (!result) {
      throw new NotFoundException(`No device found with id ${meterId}`);
    }
    result.timezone = await getLocalTimeZoneFromDevice(
      result.createdAt,
      result,
    );
    delete result['organization'];

    return result ?? null;
  }

  async findByExternalId(externalId: string): Promise<Device | null> {
    const device = await this.repository.findOne({
      where: { externalId },
    });
    return device ?? null;
  }

  async findBySerialNumber(
    serialNumber: string,
    organizationId: number,
  ): Promise<Device | null> {
    this.logger.verbose(`With in findBySerialNumber`);
    const device: Device = await this.repository.findOne({
      where: {
        serialNumber: serialNumber,
        organizationId: organizationId,
      },
    });
    if (!device) {
      this.logger.warn(`Returning null`);
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(
      device.createdAt,
      device,
    );
    return device;
  }

  async findBySerialNumberAndRegistrant(
    serialNumber: string,
    api_user_id: string,
  ): Promise<Device | null> {
    this.logger.verbose(`With in findBySerialNumberAndRegistrant`);
    const device: Device = await this.repository.findOne({
      where: {
        serialNumber: serialNumber,
        api_user_id: api_user_id,
      },
    });
    if (!device) {
      this.logger.warn(`Returning null`);
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(
      device.createdAt,
      device,
    );
    return device;
  }

  /**
   * Like findBySiteName but only returns a match when the (siteName, org) pair
   * is unique — otherwise null. Used by resolveDeviceKey for ambiguous external
   * keys where returning any-matching-row would be unsafe.
   */
  async findUniqueBySiteName(
    siteName: string,
    organizationId: number,
  ): Promise<Device | null> {
    const matches = await this.repository.find({
      where: { siteName, organizationId },
      take: 2,
    });
    return matches.length === 1 ? matches[0] : null;
  }

  /**
   * Resolve an external device key into a Device. Order:
   *   1. externalId (globally unique UUID)
   *   2. siteName (org-scoped) — only if it uniquely identifies one device
   *   3. serialNumber (deprecated; logs warning so we can plan removal)
   */
  async resolveDeviceKey(
    key: string,
    organizationId: number,
  ): Promise<Device | null> {
    const byExternal = await this.findByExternalId(key);
    if (byExternal) return byExternal;

    const bySite = await this.findUniqueBySiteName(key, organizationId);
    if (bySite) return bySite;

    const bySerial = await this.findBySerialNumber(key, organizationId);
    if (bySerial) {
      this.logger.warn(
        `resolveDeviceKey: deprecated serial-number lookup hit (key="${key}", org=${organizationId})`,
      );
    }
    return bySerial;
  }

  async findMultipleDevicesBasedExternalId(
    meterIdList: Array<string>,
    organizationId: number,
  ): Promise<Array<DeviceDTO | null>> {
    this.logger.verbose(`With in findMultipleDevicesBasedExternalId`);
    return (
      (await this.repository.find({
        where: {
          serialNumber: In(meterIdList),
          organizationId: organizationId,
        },
      })) ?? null
    );
  }

  async findMultipleDevicesBasedSiteName(
    siteNames: Array<string>,
    organizationId: number,
  ): Promise<Array<string>> {
    if (!siteNames.length) return [];
    const rows = await this.repository.find({
      where: {
        siteName: In(siteNames),
        organizationId: organizationId,
      },
      select: ['siteName'],
    });
    return rows.map((r) => r.siteName);
  }

  async syncStatusesWithEvident(): Promise<void> {
    const devices = await this.repository.find({
      where: {
        evidentDeviceId: Not(IsNull()),
      },
    });
    for (const device of devices) {
      try {
        const updatedStatus = await this.evidentDeviceService.getStatus(
          device.organizationId,
          device.evidentDeviceId,
        );
        if (updatedStatus !== device.evidentStatus) {
          this.logger.verbose(
            `Updating device ${device.id} status: ${device.evidentStatus} → ${updatedStatus}`,
          );
          device.evidentStatus =
            updatedStatus === EvidentRegistrationStatus.InProgress
              ? EvidentRegistrationStatus.Submitted
              : (updatedStatus as EvidentRegistrationStatus);
          await this.repository.save(device);
          const organization =
            await this.organizationService.getLinkedRegistrantOrSelf(
              device.organizationId,
            );
          this.sendEmailBasedOnEvidentStatus(device, organization.orgEmail);
        }
      } catch (error) {
        this.logger.warn(`Error syncing device ${device.id}: ${error.message}`);
      }
    }
  }

  sendEmailBasedOnEvidentStatus(
    device: Device,
    organizationEmail: string,
  ): Promise<boolean> {
    const deviceEvidentStatus = device.evidentStatus;
    switch (deviceEvidentStatus) {
      case EvidentRegistrationStatus.Approved:
        this.logger.verbose(`Device ${device.id} is approved on Evident`);
        return this.mailService.send({
          to: organizationEmail,
          subject: getEvidentDeviceApprovedSubject(device),
          template: EvidentDeviceApprovedTemplate({
            device,
            organizationName: device.organization.name,
          }),
        });
      case EvidentRegistrationStatus.Rejected:
        this.logger.warn(`Device ${device.id} registration was rejected`);
        return this.mailService.send({
          to: organizationEmail,
          subject: getEvidentDeviceRejectedSubject(device),
          template: EvidentDeviceRejectedTemplate({
            device,
            organizationName: device.organization.name,
          }),
        });
      default:
        this.logger.warn(
          `Device ${device.id} has an unknown status: ${deviceEvidentStatus}`,
        );
    }
  }

  public async seed(
    orgCode: number,
    newDevice: NewDeviceDTO,
  ): Promise<Device['id']> {
    this.logger.verbose(`With in seed`);
    const storedDevice = await this.repository.save({
      ...newDevice,
      organizationId: orgCode,
    });

    return storedDevice.id;
  }

  public async register(
    organizationId: number,
    newDevice: NewDeviceDTO,
    files: {
      [DocumentType.FORM_SF_02]?: Express.Multer.File[];
      [DocumentType.SF_02C]?: Express.Multer.File[];
      [DocumentType.PROOF_OF_OWNERSHIP]?: Express.Multer.File[];
      [DocumentType.METERING_EVIDENCE]?: Express.Multer.File[];
      [DocumentType.SINGLE_LINE_DIAGRAM]?: Express.Multer.File[];
      [DocumentType.PROJECT_PHOTOS]?: Express.Multer.File[];
      [DocumentType.COD_PROOF]?: Express.Multer.File[];
      [DocumentType.OTHER_DOCUMENTS]?: Express.Multer.File[];
    } | null,
    api_user_id?: string,
    role?: Role,
  ): Promise<Device> {
    this.logger.verbose(`Within register`);
    // Partial-draft support: country code is no longer required at create time.
    // Missing fields are flagged to the reviewer, not rejected at submit.
    if (newDevice && newDevice.countryCode) {
      newDevice.countryCode = newDevice.countryCode.toUpperCase();
    }

    const sdgBenefitList = SDGBenefits;

    // Uniqueness checks only apply when the registrant actually provided a value.
    // Multiple in-progress drafts may have null siteName / serialNumber.
    if (newDevice.siteName) {
      // siteName is unique platform-wide (matches the /check-name
      // pre-flight semantics). Org-scoping is intentionally not used
      // here.
      const checkSiteName = await this.repository.findOne({
        where: { siteName: newDevice.siteName },
      });

      if (checkSiteName) {
        throw new ConflictException({
          success: false,
          message: `A device with site name "${newDevice.siteName}" already exists`,
        });
      }
    }

    if (newDevice.serialNumber) {
      const checkSerialNumber = await this.repository.findOne({
        where: {
          serialNumber: newDevice.serialNumber,
          organizationId: organizationId,
        },
      });

      if (checkSerialNumber) {
        this.logger.error(
          `SerialNumber already exists in this organization, can't add entry with same serialNumber ${newDevice.serialNumber}`,
        );
        throw new ConflictException({
          success: false,
          message: `SerialNumber already exists in this organization, can't add entry with same serialNumber ${newDevice.serialNumber}`,
        });
      }
    }
    newDevice.externalId = uuid();

    if (
      newDevice.SDGBenefits &&
      (newDevice.SDGBenefits.includes('0') ||
        newDevice.SDGBenefits.includes('1'))
    ) {
      newDevice.SDGBenefits = [];
    } else if (Array.isArray(newDevice.SDGBenefits)) {
      newDevice.SDGBenefits.forEach((sdbBenefitName: string, index: number) => {
        const foundEle = sdgBenefitList.find(
          (ele) =>
            ele.name.toLowerCase() === sdbBenefitName.toString().toLowerCase(),
        );
        newDevice.SDGBenefits[index] = foundEle ? foundEle.value : 'invalid';
      });

      newDevice.SDGBenefits = newDevice.SDGBenefits.filter(
        (ele) => ele !== 'invalid',
      );
    } else {
      newDevice.SDGBenefits = [];
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Fingerprint uniqueness is only meaningful when the identifying fields
      // are actually provided. For partial drafts (lat/lng/capacity/commDate/
      // serialNumber all blank), skip the check so multiple in-progress drafts
      // can coexist. Fingerprint is persisted as null in that case.
      const hasIdentifyingFields =
        !!newDevice.latitude &&
        !!newDevice.longitude &&
        !!newDevice.commissioningDate &&
        newDevice.capacity != null &&
        !!newDevice.serialNumber;

      let fingerprint: string | null = null;
      if (hasIdentifyingFields) {
        fingerprint = generateDeviceFingerprint({
          latitude: newDevice.latitude,
          longitude: newDevice.longitude,
          commissioningDate: newDevice.commissioningDate,
          capacity: newDevice.capacity,
          fuelCode: newDevice.fuelCode,
          deviceTypeCode: newDevice.deviceTypeCode,
          serialNumber: newDevice.serialNumber,
        });

        const fingerprintExists = await this.repository.findOne({
          where: {
            fingerprint: fingerprint,
          },
        });

        if (fingerprintExists) {
          throw new ConflictException({
            message: 'There is a device with matching details',
            statusCode: 409,
          });
        }
      }
      if (role === Role.Registrant) {
        const org = await this.organizationService.findOne(organizationId, {
          api_user_id: api_user_id,
        } as FindOneOptions<Organization>);

        const orgUser = await this.userService.findByEmail(org.orgEmail);

        if (orgUser.role !== Role.Registrant) {
          this.logger.error(`Unauthorized`);
          throw new UnauthorizedException({
            success: false,
            message: 'Unauthorized',
          });
        }
      }
      const result = await queryRunner.manager.save(this.repository.target, {
        ...newDevice,
        fingerprint,
        organizationId: organizationId,
        api_user_id: api_user_id,
      });
      if (files) {
        const documentTypes = {
          [DocumentType.FORM_SF_02]: DocumentType.FORM_SF_02,
          [DocumentType.SF_02C]: DocumentType.SF_02C,
          [DocumentType.PROOF_OF_OWNERSHIP]: DocumentType.PROOF_OF_OWNERSHIP,
          [DocumentType.METERING_EVIDENCE]: DocumentType.METERING_EVIDENCE,
          [DocumentType.SINGLE_LINE_DIAGRAM]: DocumentType.SINGLE_LINE_DIAGRAM,
          [DocumentType.PROJECT_PHOTOS]: DocumentType.PROJECT_PHOTOS,
          [DocumentType.COD_PROOF]: DocumentType.COD_PROOF,
          [DocumentType.OTHER_DOCUMENTS]: DocumentType.OTHER_DOCUMENTS,
        };

        const siteName = (result.siteName || 'project')
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase();
        const projectSubfolder = `${siteName}-${uuid()}`;

        for (const [field, documentType] of Object.entries(documentTypes)) {
          const deviceId = result.id;
          for (const file of files[field] || []) {
            try {
              await this.documentsService.upload(
                deviceId,
                DocumentTargetType.DEVICE,
                documentType,
                file,
                projectSubfolder,
              );
            } catch (error) {
              this.logger.error(`Failed to upload ${field}: ${error.message}`);
              throw new BadRequestException(
                `Failed to upload ${field}: ${error.message || 'Invalid file format or size'}`,
              );
            }
          }
        }
      }
      await queryRunner.commitTransaction();
      delete result['organization'];
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findBySiteName(
    siteName: string,
    organizationId: number,
  ): Promise<Device | null> {
    this.logger.verbose(`With in findBySiteName`);
    const device: Device = await this.repository.findOne({
      where: {
        siteName,
        organizationId,
      },
    });
    if (!device) {
      this.logger.warn(`Returning null`);
      return null;
    }
    device.timezone = await getLocalTimeZoneFromDevice(
      device.createdAt,
      device,
    );
    return device;
  }

  async update(
    organizationId: number,
    role: Role,
    serialNumber: string,
    updateDeviceDTO: UpdateDeviceDTO,
    lookupBy: 'serialNumber' | 'siteName' = 'serialNumber',
  ): Promise<Device> {
    this.logger.verbose(`With in update`);
    const rule = // eslint-disable-line @typescript-eslint/no-unused-vars
      role === Role.SiteOperator
        ? {
            where: {
              organizationId,
            },
          }
        : undefined;

    // Primary: try externalId first (globally unique)
    let currentDevice = await this.findByExternalId(serialNumber.trim());

    // Fallback: try serialNumber or siteName (scoped to org)
    if (!currentDevice) {
      currentDevice =
        lookupBy === 'siteName'
          ? await this.findBySiteName(serialNumber.trim(), organizationId)
          : await this.findBySerialNumber(serialNumber.trim(), organizationId);
    }

    if (!currentDevice) {
      this.logger.error(`No device found with ${lookupBy} ${serialNumber}`);
      throw new NotFoundException(`No device found with ${lookupBy} "${serialNumber}"`);
    }

    if (updateDeviceDTO.siteName) {
      // Global uniqueness — see create-time check above.
      const duplicateName = await this.repository.findOne({
        where: { siteName: updateDeviceDTO.siteName },
      });
      if (duplicateName && duplicateName.id !== currentDevice.id) {
        throw new ConflictException({
          success: false,
          message: `A device with site name "${updateDeviceDTO.siteName}" already exists`,
        });
      }
    }

    updateDeviceDTO.externalId = currentDevice.externalId;
    const sdgBenefitList = SDGBenefits;

    if (!updateDeviceDTO.SDGBenefits) {
      // caller didn't send SDGBenefits — leave existing value untouched
    } else if (
      updateDeviceDTO.SDGBenefits.includes('0') ||
      updateDeviceDTO.SDGBenefits.includes('1')
    ) {
      updateDeviceDTO.SDGBenefits = [];
    } else if (Array.isArray(updateDeviceDTO.SDGBenefits)) {
      updateDeviceDTO.SDGBenefits.forEach(
        (sdbBenefitName: string, index: number) => {
          const foundEle = sdgBenefitList.find(
            (ele) =>
              ele.name.toLowerCase() ===
              sdbBenefitName.toString().toLowerCase(),
          );
          if (foundEle) {
            updateDeviceDTO.SDGBenefits[index] = foundEle.value;
          } else {
            updateDeviceDTO.SDGBenefits[index] = 'invalid';
          }
        },
      );
      updateDeviceDTO.SDGBenefits = updateDeviceDTO.SDGBenefits.filter(
        (ele) => ele !== 'invalid',
      );
    } else {
      updateDeviceDTO.SDGBenefits = [];
    }
    const fingerprint = generateDeviceFingerprint({
      latitude: updateDeviceDTO.latitude ?? currentDevice.latitude,
      longitude: updateDeviceDTO.longitude ?? currentDevice.longitude,
      commissioningDate: updateDeviceDTO.commissioningDate ?? currentDevice.commissioningDate,
      capacity: updateDeviceDTO.capacity ?? currentDevice.capacity,
      fuelCode: updateDeviceDTO.fuelCode ?? currentDevice.fuelCode,
      deviceTypeCode: updateDeviceDTO.deviceTypeCode ?? currentDevice.deviceTypeCode,
      serialNumber: updateDeviceDTO.serialNumber ?? currentDevice.serialNumber,
    });

    const fingerprintExists = await this.repository.findOne({
      where: {
        fingerprint: fingerprint,
        externalId: Not(updateDeviceDTO.externalId),
      },
    });

    if (fingerprintExists) {
      throw new ConflictException({
        message: 'There is a device with matching details',
        statusCode: 409,
      });
    }
    this.logger.verbose(
      `[update-debug] dto.address=${JSON.stringify((updateDeviceDTO as any).address)} ` +
      `addressKeyPresent=${'address' in (updateDeviceDTO as any)} ` +
      `keys=${Object.keys(updateDeviceDTO as any).join(',')}`,
    );
    // Only overwrite fields that were actually sent (not undefined)
    for (const [key, value] of Object.entries(updateDeviceDTO)) {
      if (value !== undefined) {
        (currentDevice as any)[key] = value;
      }
    }
    this.logger.verbose(
      `[update-debug] post-loop currentDevice.address=${JSON.stringify((currentDevice as any).address)}`,
    );
    currentDevice.fingerprint = fingerprint;
    currentDevice.updatedAt = new Date();
    return await this.repository.save(currentDevice);
  }

  async findUngrouped(
    organizationId: number,
    orderFilterDto: DeviceGroupByDTO,
    filterDto: FilterDTO,
    pageNumber: number,
  ): Promise<{
    totalPages: number;
    currentPage: number;
    groups: GroupedDevicesDTO[];
  }> {
    this.logger.verbose(`With in findUngrouped`);
    const limit = LIMIT_PER_PAGE;
    let query = this.getFilteredQuery(filterDto);
    if (pageNumber != null && pageNumber != undefined) {
      query = {
        ...query,
        skip: (pageNumber - 1) * limit,
        take: limit,
      };
    }
    let where: any = query.where;

    where = {
      ...where,
      groupId: null,
      organizationId,
    };

    query.where = where;

    // Only include devices with an approved review
    const approvedIds = await this.getApprovedDeviceIds();
    const [allDevices] = await this.repository.findAndCount(query);
    const filtered = allDevices.filter((d) => approvedIds.has(d.id));
    const totalCount = filtered.length;
    const start = pageNumber != null ? (pageNumber - 1) * limit : 0;
    const devices = filtered.slice(start, start + limit);

    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = pageNumber ?? 1;
    delete devices['organization'];
    return this.groupDevices(orderFilterDto, devices, currentPage, totalPages);
  }

  async findUngroupedById(id: number): Promise<boolean> {
    this.logger.verbose(`With in findUngroupedById`);
    const devices = await this.repository.find({
      where: { groupId: null, id },
    });
    if (devices) {
      return true;
    }
  }

  getDeviceTypes(): CodeNameDTO[] {
    this.logger.verbose(`With in getDeviceTypes`);
    return IREC_DEVICE_TYPES;
  }

  getFuelTypes(): CodeNameDTO[] {
    this.logger.verbose(`With in getFuelTypes`);
    return IREC_FUEL_TYPES;
  }

  isValidDeviceType(deviceType: string): boolean {
    this.logger.verbose(`With in isValidDeviceType`);
    return !!this.getDeviceTypes().find((device) => device.code === deviceType);
  }

  isValidFuelType(fuelType: string): boolean {
    this.logger.verbose(`With in isValidFuelType`);
    return !!this.getFuelTypes().find((fuel) => fuel.code === fuelType);
  }

  groupDevices(
    orderFilterDto: DeviceGroupByDTO,
    devices: Device[],
    currentPage?: number,
    totalPages?: number,
  ): {
    totalPages: number;
    currentPage: number;
    groups: GroupedDevicesDTO[];
  } {
    this.logger.verbose(`With in groupDevices`);
    const { orderBy } = orderFilterDto;
    const orderByRules: DeviceOrderBy[] = Array.isArray(orderBy)
      ? orderBy
      : [orderBy];
    const groupedDevicesByProps: DeviceDTO[][] = groupByProps(
      devices,
      (item) => {
        return [
          ...orderByRules.map((order: DeviceOrderBy) => {
            if (DeviceSortPropertyMapper[order]) {
              const deviceKey: DeviceKey = DeviceSortPropertyMapper[
                order
              ] as DeviceKey;
              return item[deviceKey];
            }
          }),
        ];
      },
    );
    return {
      totalPages,
      currentPage,
      groups: groupedDevicesByProps.map((devices: DeviceDTO[]) => ({
        name: this.getDeviceGroupNameFromGroupedDevices(devices, orderByRules),
        devices: devices.map(
          (device: UngroupedDeviceDTO): UngroupedDeviceDTO => ({
            ...device,
            commissioningDateRange: getDateRangeFromYear(
              device.commissioningDate,
            ),
            capacityRange: getCapacityRange(device.capacity),
            selected: true,
          }),
        ),
      })),
    };
  }

  private getDeviceGroupNameFromGroupedDevices(
    devices: DeviceDTO[],
    orderByRules: DeviceOrderBy[],
  ): string {
    this.logger.verbose(`With in getDeviceGroupNameFromGroupedDevices`);
    return `${orderByRules.map((orderRule: DeviceOrderBy) => {
      const deviceKey: DeviceKey = DeviceSortPropertyMapper[
        orderRule
      ] as DeviceKey;
      if (deviceKey === 'fuelCode') {
        return getFuelNameFromCode(devices[0][deviceKey]);
      }
      if (deviceKey === 'deviceTypeCode') {
        return getDeviceTypeFromCode(devices[0][deviceKey]);
      }
      return devices[0][deviceKey];
    })}`;
  }

  public getFilteredQuery(
    filter: FilterDTO,
    orgId?: number,
  ): FindManyOptions<Device> {
    this.logger.verbose(`With in getFilteredQuery`);
    const where: FindOptionsWhere<Device> = cleanDeep({
      fuelCode: filter.fuelCode,
      capacity: filter.capacity && LessThanOrEqual(filter.capacity),
      gridInterconnection: filter.gridInterconnection,
      operatingConfiguration: filter.operatingConfiguration,
      sourceAccessMode: filter.sourceAccessMode,
      countryCode: filter.country && getCodeFromCountry(filter.country),
    });
    if (orgId != null || orgId != undefined) {
      where.organizationId = orgId;
    } else if (
      filter.organizationId != null &&
      filter.organizationId != undefined
    ) {
      where.organizationId = filter.organizationId;
    }
    if (filter.start_date != null && filter.end_date === undefined) {
      where.commissioningDate = MoreThanOrEqual(filter.start_date);
    }
    if (filter.start_date === undefined && filter.end_date != null) {
      where.commissioningDate = LessThanOrEqual(filter.end_date);
    }
    if (filter.start_date != null && filter.end_date != null) {
      where.commissioningDate =
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date);
    }
    if (filter.SDGBenefits) {
      const newsdg = filter.SDGBenefits.toString();
      const sdgBenefitsArray = newsdg.split(',');
      where.SDGBenefits = Raw(
        (alias) =>
          `${alias} ILIKE ANY(ARRAY[${sdgBenefitsArray.map((term) => `'%${term}%'`)}])`,
      );
    }
    if (filter.deviceTypeCode) {
      const newDeviceType = filter.deviceTypeCode.toString();
      const newDTypeArray = newDeviceType.split(',');
      where.deviceTypeCode = Raw(
        (alias) =>
          `${alias} ILIKE ANY(ARRAY[${newDTypeArray.map((term) => `'%${term}%'`)}])`,
      );
    }
    if (filter.offTaker) {
      const newOffTaker = filter.offTaker.toString();
      const newOffTakerArray = newOffTaker.split(',');
      where.offTaker = Raw(
        (alias) =>
          `${alias} ILIKE ANY(ARRAY[${newOffTakerArray.map((term) => `'%${term}%'`)}])`,
      );
    }
    return {
      where,
      order: {
        organizationId: 'DESC',
      },
    };
  }

  private getRawFilter(filter: string): FindOperator<any> {
    this.logger.verbose(`With in getRawFilter`);
    return Raw((alias) => `${alias} = Any(SDGBenefits)`, {
      SDGBenefits: [filter],
    });
  }

  public async addGroupIdToDeviceForReserving(
    currentDevice: Device,
    groupId: number,
  ): Promise<Device> {
    this.logger.verbose(`With in addGroupIdToDeviceForReserving`);
    currentDevice.groupId = groupId;
    return await this.repository.save(currentDevice);
  }

  public async addToGroup(
    currentDevice: Device,
    groupId: number,
    organizationOwnerCode?: number,
  ): Promise<Device> {
    this.logger.verbose(`With in addToGroup`);
    const deviceExists = await this.getDeviceForGroup(
      currentDevice.id,
      groupId,
    );
    if (deviceExists) {
      const message = `Device with id: ${currentDevice.id} already added to this group`;
      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
    if (currentDevice.groupId) {
      const message = `Device with id: ${currentDevice.id} already belongs to a group`;
      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
    if (
      organizationOwnerCode &&
      currentDevice.organizationId !== organizationOwnerCode
    ) {
      this.logger.error(
        `Device with id: ${currentDevice.id} belongs to a different owner`,
      );
      throw new NotAcceptableException(
        `Device with id: ${currentDevice.id} belongs to a different owner`,
      );
    }
    currentDevice.groupId = groupId;
    return await this.repository.save(currentDevice);
  }

  public async removeFromGroup(
    deviceId: number,
    groupId: number,
  ): Promise<Device> {
    this.logger.verbose(`With in removeFromGroup`);
    const currentDevice = await this.getDeviceForGroup(deviceId, groupId);
    if (!currentDevice) {
      this.logger.error(
        `in removeFromGroup 373 No device found with id ${deviceId} and groupId: ${groupId}`,
      );
    }
    if (currentDevice) {
      currentDevice.groupId = null;
    }

    return await this.repository.save(currentDevice);
  }

  private async getDeviceForGroup(
    deviceId: number,
    groupId: number,
  ): Promise<Device | undefined> {
    this.logger.verbose(`With in getDeviceForGroup`);
    return this.repository.findOne({
      where: {
        id: deviceId,
        groupId,
      },
    });
  }

  public async updateReadType(
    deviceId: string,
    meterReadType: string,
  ): Promise<Device> {
    this.logger.verbose(`With in updatereadtype`);
    const deviceReadType = await this.repository.findOne({
      where: {
        externalId: deviceId,
      },
    });
    if (!deviceReadType) {
      this.logger.error(`No device found with id ${deviceId}`);
      throw new NotFoundException(`No device found with id ${deviceId}`);
    }
    deviceReadType.meterReadtype = meterReadType;

    return await this.repository.save(deviceReadType);
  }

  public async updateTimezone(
    deviceId: string,
    timeZone: string,
  ): Promise<Device> {
    this.logger.verbose(`With in updatetimezone`);
    const deviceReadType = await this.repository.findOne({
      where: {
        externalId: deviceId,
      },
    });
    if (!deviceReadType) {
      this.logger.error(`No device found with id ${deviceId}`);
      throw new NotFoundException(`No device found with id ${deviceId}`);
    }
    deviceReadType.timezone = timeZone;

    return await this.repository.save(deviceReadType);
  }

  private getBuyerFilteredQuery(
    filter: FilterDTO,
    pageNumber,
    limit,
  ): FindManyOptions<Device> {
    this.logger.verbose(`With in getBuyerFilteredQuery`);
    const where: FindOptionsWhere<Device> = cleanDeep({
      fuelCode: filter.fuelCode,
      deviceTypeCode: filter.deviceTypeCode,
      capacity: filter.capacity && LessThanOrEqual(filter.capacity),
      offTaker: filter.offTaker,
      countryCode: filter.country && getCodeFromCountry(filter.country),
      commissioningDate:
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date),
    });
    return {
      where,
      order: {
        organizationId: 'ASC',
      },
      skip: (pageNumber - 1) * limit,
      take: limit,
    };
  }

  public async findDeviceForBuyer(
    filterDto: FilterDTO,
    pageNumber: number,
    api_user_id: string,
  ): Promise<any> {
    const limit = LIMIT_PER_PAGE;
    let query = this.getFilteredQuery(filterDto);
    if (pageNumber) {
      query = {
        ...query,
        skip: (pageNumber - 1) * limit,
        take: limit,
      };
    }
    let where: any = query.where;

    where = {
      ...where,
      groupId: null,
      api_user_id: api_user_id,
      capacity: LessThan(SMALL_DEVICES_MAX_CAPACITY),
    };

    query.where = where;

    // Only include devices with an approved review
    const approvedIds = await this.getApprovedDeviceIds();
    const [allDevices] = await this.repository.findAndCount(query);
    const filtered = allDevices.filter((d) => approvedIds.has(d.id));
    const totalCount = filtered.length;
    const start = pageNumber ? (pageNumber - 1) * limit : 0;
    const devices = filtered.slice(start, start + limit);

    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = pageNumber;

    const newUnreservedDevices = devices.map((device: Device) => {
      delete device['organization'];
      return device;
    });
    return {
      devices: newUnreservedDevices,
      currentPage,
      totalPages,
      totalCount,
    };
  }

  public async addCertificateIssueDateLogForDevice(
    params: CheckCertificateIssueDateLogForDeviceEntity,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in AddCertificateIssueDateLogForDevice`);
    return await this.checkDeviceLogCertificateRepository.save({
      ...params,
    });
  }

  //add new fuction for add window cycle date for late certificate
  public async addLateCertificateIssueDateLogForDevice(
    params: DeviceLateOngoingIssueCertificateEntity,
  ): Promise<DeviceLateOngoingIssueCertificateEntity> {
    this.logger.verbose(`With in AddLateCertificateIssueDateForDevice`);
    return await this.lateDeviceCertificateRepository.save({
      ...params,
    });
  }

  @Profile()
  public async findAllLateCycle(
    groupId?: number,
  ): Promise<DeviceLateOngoingIssueCertificateEntity[]> {
    this.logger.verbose(`With in DeviceLateOngoingIssueCertificateList`);
    const whereClause: any = {
      certificate_issued: false,
      archived_at: null,
    };
    if (groupId) {
      whereClause.groupId = groupId; // Add groupId condition if provided
      this.logger.debug(`filtering by groupId: ${groupId}`);
    }
    return await this.lateDeviceCertificateRepository.find({
      where: whereClause,
      order: {
        late_end_date: 'ASC',
      },
    });
  }

  public async findOneLateCycle(
    groupId: number,
    externalId: string,
  ): Promise<DeviceLateOngoingIssueCertificateEntity[]> {
    return await this.lateDeviceCertificateRepository.find({
      where: {
        groupId: groupId,
        device_externalid: externalId,
        //createdAt:LessThanOrEqual(reservation_end_UtcDate)
      },
      order: {
        id: 'ASC',
      },
      take: 1,
    });
  }

  @Profile()
  public async getCheckCertificateIssueDateLogForDevice(
    deviceid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getCheckCertificateIssueDateLogForDevice`);
    const query = this.getDeviceLogFilteredQuery(deviceid, startDate, endDate);
    try {
      const device = await query.getRawMany();
      return device.map((s: any) => {
        const item: any = {
          certificate_issuance_startdate:
            s.device_certificate_issuance_startdate,
          certificate_issuance_enddate: s.device_certificate_issuance_enddate,
          readvalue_watthour: s.device_readvalue_watthour,
          status: s.device_status,
          deviceid: s.device_externalId,
        };
        return item;
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve users`, error.stack);
    }
  }

  @Profile()
  private getDeviceLogFilteredQuery(
    deviceid: string,
    startDate: Date,
    endDate: Date,
  ): SelectQueryBuilder<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in getDeviceLogFilteredQuery`);
    //  const { organizationName, status } = filterDto;
    return this.checkDeviceLogCertificateRepository
      .createQueryBuilder('device')
      .where('device.externalId = :deviceid', { deviceid: deviceid })
      .andWhere(
        new Brackets((db) => {
          db.where("device.status ='Requested' OR device.status ='Succeeded'");
        }),
      )
      .andWhere(
        new Brackets((db) => {
          db.where(
            'device.certificate_issuance_startdate BETWEEN :startDateFirstWhere AND :endDateFirstWhere ',
            { startDateFirstWhere: startDate, endDateFirstWhere: endDate },
          )
            .orWhere(
              'device.certificate_issuance_enddate BETWEEN :startDateSecondtWhere AND :endDateSecondWhere',
              { startDateSecondtWhere: startDate, endDateSecondWhere: endDate },
            )
            .orWhere(
              ':startdateThirdWhere BETWEEN device.certificate_issuance_startdate AND device.certificate_issuance_enddate',
              { startdateThirdWhere: startDate },
            )
            .orWhere(
              ':enddateforthdWhere BETWEEN device.certificate_issuance_startdate AND device.certificate_issuance_enddate',
              { enddateforthdWhere: endDate },
            );
        }),
      );
  }

  async getOrganizationDevicesTotal(organizationId: number): Promise<Device[]> {
    this.logger.verbose(`With in getOrganizationDevicesTotal`);
    const devices = await this.repository.find({
      where: { organizationId },
    });
    const totalAmountOfReads = [];
    await Promise.all(
      devices.map(async (device: Device) => {
        const certifiedAmountOfRead =
          await this.checkDeviceLogCertificateRepository.find({
            where: { externalId: device.externalId },
          });
        const totalCertifiedReadValue = certifiedAmountOfRead.reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.readvalue_watthour,
          0,
        );
        const totalAmount = await this.readsService.getAllByExternalId(
          device.externalId,
        );
        const totalReadValue = totalAmount.reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );
        totalAmountOfReads.push({
          totalcertifiedReadValue: totalCertifiedReadValue,
          totalReadValue: totalReadValue,
        });
      }),
    );
    return totalAmountOfReads;
  }

  public async changeDeviceCreatedAt(
    externalId: string,
    onboardedDate: Date,
    givenDate: string,
  ): Promise<string> {
    this.logger.verbose(`With in changeDeviceCreatedAt`);
    const numberOfHistoryReads: number =
      await this.getNumberOfHistoryReads(externalId);
    const numberOfOngReads: number =
      await this.readsService.countOngoingReadsSinceDeviceOnboardingDate(
        externalId,
        onboardedDate,
      );

    if (numberOfHistoryReads <= 0 && numberOfOngReads <= 0) {
      return this.changeCreatedAtDate(onboardedDate, givenDate, externalId);
    } else {
      this.logger.error(
        `The given device already had some meter reads;Thus you cannot change the createdAt`,
      );
      throw new HttpException(
        'The given device already had some meter reads;Thus you cannot change the createdAt',
        409,
      );
    }
  }

  async getNumberOfHistoryReads(deviceId: string): Promise<number> {
    this.logger.verbose(`With in getNumberOfHistReads`);
    return this.readsService.countByType(deviceId, ReadType.History);
  }

  async changeCreatedAtDate(
    onboardedDate: Date,
    givenDate: string,
    externalId: string,
  ): Promise<string> {
    this.logger.verbose(`With in changecreatedAtDate`);
    this.logger.debug('THE EXTERNALID IS::::::::::::::::::::::::' + externalId);
    const sixMonthsAgo = new Date(onboardedDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (
      new Date(givenDate) < sixMonthsAgo ||
      new Date(givenDate) >= new Date(onboardedDate)
    ) {
      this.logger.error(
        `Given date is more than 6 months before the onboarded date or after or equal to the onboarded date`,
      );
      throw new HttpException(
        'Given date is more than 6 months before the onboarded date or after or equal to the onboarded date',
        400,
      );
    }

    await this.repository.update(
      { createdAt: onboardedDate, externalId: externalId },
      { createdAt: givenDate },
    );
    this.logger.log(
      `Changed createdAt date from ${onboardedDate} to ${givenDate}`,
    );
    return `Changed createdAt date from ${onboardedDate} to ${givenDate}`;
  }

  public async atto(
    organizationId: number,
    externalId: string,
  ): Promise<any[]> {
    this.logger.verbose(`With in atto`);
    const queryBuilder = this.repository.createQueryBuilder('Device');
    const rows = await queryBuilder
      .where('Device.organizationId = :organizationId', { organizationId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('Device.serialNumber = :externalId', {
            externalId,
          }).orWhere('Device.serialNumber LIKE :pattern', {
            pattern: `${externalId}%`,
          });
        }),
      )
      .orderBy('Device.externalId')
      .getMany();
    this.logger.debug(rows);
    const newDevices = [];
    await rows.map((device: Device) => {
      delete device['operatorExternalId'];
      newDevices.push(device);
    });
    return newDevices;
  }

  async getLastCertifiedDevicelogByGroupId(
    groupId: number,
    deviceId: string,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getLastCertifiedDevicelogBYgroupId`);
    return await this.checkDeviceLogCertificateRepository.find({
      where: {
        groupId: groupId,
        externalId: deviceId,
      },
      order: {
        certificate_issuance_enddate: 'DESC',
      },
    });
  }

  async getCertifiedDeviceDateRange(
    groupId: number,
    device?: DeviceDTO,
  ): Promise<any> {
    this.logger.verbose(`With in getcertifieddevicedaterange`);

    const queryBuilder = this.checkDeviceLogCertificateRepository
      .createQueryBuilder('deviceData')
      .select(
        'MIN(deviceData.certificate_issuance_startdate)',
        'firstcertifiedstartdate',
      )
      .addSelect(
        'MAX(deviceData.certificate_issuance_enddate)',
        'lastcertifiedenddate',
      )
      .leftJoin(Device, 'd', 'deviceData.externalId = d.externalId')
      .where('deviceData.externalId= :externalId', {
        externalId: device.externalId,
      })
      .andWhere('deviceData.groupId= :groupId', { groupId });
    const result = await queryBuilder.getRawOne();
    return { ...result, serialNumber: device.serialNumber };
  }

  async getCertifiedDeviceDateRangeByGroupId(
    groupId: number,
    pageNumber?: number,
  ): Promise<any> {
    this.logger.verbose(`With in getcertifieddevicedaterangeBygroupid`);
    if (pageNumber === undefined || pageNumber === null) {
      pageNumber = 1;
    }
    const pageSize = 10;
    const skip: number = (pageNumber - 1) * pageSize;

    const queryBuilder = await this.checkDeviceLogCertificateRepository
      .createQueryBuilder('deviceData')
      .leftJoin('device', 'd', 'deviceData.externalId = d.externalId')
      .select([
        'd.serialNumber AS "serialNumber"',
        'MIN(deviceData.certificate_issuance_startdate) AS firstcertifiedstartdate',
        'MAX(deviceData.certificate_issuance_enddate) AS lastcertifiedenddate',
      ])
      .where('deviceData.groupId = :groupId', { groupId })
      .groupBy('d.serialNumber')
      .offset(skip)
      .limit(pageSize);
    const result = await queryBuilder.getRawMany();
    const count = await queryBuilder.getCount();
    const totalPages = Math.ceil(count / pageSize);

    return {
      certifieddevices_startToend: result,
      totalItems: count,
      currentPage: pageNumber,
      totalPages: totalPages,
    };
  }

  async remove(
    id: number,
    filterOptions: { groupId: number; organizationId?: number },
  ): Promise<any> {
    this.logger.verbose(`With in remove`);
    const checkDeviceUnreserve = await this.findOne(
      id,
      filterOptions as FindOneOptions<Device>,
    );
    if (!checkDeviceUnreserve) {
      // The original code dereferenced .serialNumber on the null
      // variable here AND mis-described "not found" as "already in
      // reservation" — fixed both.
      const message = `Device id ${id} not found (or not in your scope)`;
      this.logger.error(message);
      return {
        success: false,
        message,
      };
    }
    // Only block deletion if the device is in an active reservation AND
    // has at least one cert-log row that reached an on-chain mint
    // (issuer_certificate_id IS NOT NULL). Stale Requested-only rows from
    // a removed reservation should not pin a device forever.
    if (checkDeviceUnreserve.groupId != null) {
      // issuer_certificate_id is a DB column but isn't declared on the
      // entity, so the where-typed find() can't reference it. Drop to
      // a query builder.
      const mintedRows = await this.checkDeviceLogCertificateRepository
        .createQueryBuilder('cl')
        .where('cl."externalId" = :ext', {
          ext: checkDeviceUnreserve.externalId,
        })
        .andWhere('cl.issuer_certificate_id IS NOT NULL')
        .getCount();

      if (mintedRows > 0) {
        const prettySerial = (checkDeviceUnreserve.serialNumber ?? '').replace(
          /;/g,
          ' ; ',
        );
        const message = `Device "${prettySerial}" has ${mintedRows} on-chain certificate ${mintedRows === 1 ? 'entry' : 'entries'} and is part of an active reservation (group ${checkDeviceUnreserve.groupId}). Remove it from the reservation first, or ask an admin to purge the cert history.`;
        this.logger.error(message);
        return {
          success: false,
          message,
        };
      }
    }
    await this.repository.delete(id);
    this.logger.log(`device deleted Successfully`);
    return {
      success: true,
      message: 'device deleted Successfully',
    };
  }

  /**
   * Admin bulk-delete. Removes the device rows together with EVERY
   * device-linked row across the schema:
   *
   *   - documents (DB + S3 keys)
   *   - upload_log, e_signature_log, ai_audit_log, verification_reports,
   *     audit_log, meter_read_reviews                            [device_id]
   *   - meter_reads, failed_meter_reads, aggregate_meterread,
   *     delta_firstread, history_intermediate_meteread,
   *     check_certificate_issue_date_log_for_device              [externalId]
   *   - certificate_read_model, issuer_certificate,
   *     issuer_certification_request, old_issuer_certificate     [deviceId]
   *   - submissions matching siteName slug                       [slug join]
   *   - chats + chat_conversations for the site                  [siteName]
   *
   * DB deletes happen in a single transaction. S3 deletes run after the
   * commit (best-effort — failures are logged, not surfaced).
   */
  async bulkRemove(
    ids: number[],
  ): Promise<{
    success: boolean;
    deletedDevices: number;
    deletedDocuments: number;
    skipped: { id: number; reason: string }[];
  }> {
    this.logger.verbose(`bulkRemove ids=${ids.join(',')}`);
    if (!ids.length) {
      return { success: true, deletedDevices: 0, deletedDocuments: 0, skipped: [] };
    }
    const devices = await this.repository.find({ where: { id: In(ids) } });
    const foundIds = new Set(devices.map((d) => d.id));
    const skipped: { id: number; reason: string }[] = ids
      .filter((id) => !foundIds.has(id))
      .map((id) => ({ id, reason: 'not found' }));

    const externalIds = devices
      .map((d) => d.externalId)
      .filter((x): x is string => !!x);
    const siteNames = devices
      .map((d) => d.siteName)
      .filter((s): s is string => !!s && s.length > 0);
    const slugs = devices
      .map((d) => (d.siteName ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .filter((s) => s.length > 0);
    const deviceIds = devices.map((d) => d.id);

    if (!deviceIds.length) {
      return { success: true, deletedDevices: 0, deletedDocuments: 0, skipped };
    }

    await this.connection.transaction(async (manager) => {
      // by externalId
      if (externalIds.length) {
        await manager.query(
          `DELETE FROM check_certificate_issue_date_log_for_device WHERE "externalId" = ANY($1::text[])`,
          [externalIds],
        );
        await manager.query(
          `DELETE FROM meter_reads WHERE external_id = ANY($1::text[])`,
          [externalIds],
        );
        await manager.query(
          `DELETE FROM failed_meter_reads WHERE external_id = ANY($1::text[])`,
          [externalIds],
        );
        await manager.query(
          `DELETE FROM aggregate_meterread WHERE "externalId" = ANY($1::text[])`,
          [externalIds],
        );
        await manager.query(
          `DELETE FROM delta_firstread WHERE "externalId" = ANY($1::text[])`,
          [externalIds],
        );
        await manager.query(
          `DELETE FROM history_intermediate_meteread WHERE "externalId" = ANY($1::text[])`,
          [externalIds],
        );
      }
      // Flush AI response cache for every file uploaded against these
      // devices. ai_response_cache is keyed on content_hash, which is
      // the same SHA-256 stored on upload_log.file_hash_sha256. A doc
      // shared across devices would force one re-extraction elsewhere;
      // acceptable trade for guaranteeing no AI residue from the
      // deleted site.
      await manager.query(
        `DELETE FROM ai_response_cache WHERE content_hash IN (
           SELECT DISTINCT file_hash_sha256
             FROM upload_log
            WHERE device_id = ANY($1::int[])
              AND file_hash_sha256 IS NOT NULL
         )`,
        [deviceIds],
      );
      // by device_id (or deviceId for camelCase tables)
      await manager.query(
        `DELETE FROM upload_log WHERE device_id = ANY($1::int[])`,
        [deviceIds],
      );
      await manager.query(
        `DELETE FROM e_signature_log WHERE device_id = ANY($1::int[])`,
        [deviceIds],
      );
      await manager.query(
        `DELETE FROM ai_audit_log WHERE device_id = ANY($1::int[])`,
        [deviceIds],
      );
      await manager.query(
        `DELETE FROM verification_reports WHERE device_id = ANY($1::int[])`,
        [deviceIds],
      );
      await manager.query(
        `DELETE FROM audit_log WHERE device_id = ANY($1::int[])`,
        [deviceIds],
      );
      await manager.query(
        `DELETE FROM meter_read_reviews WHERE device_id = ANY($1::int[])`,
        [deviceIds],
      );
      // These four store the device's externalId (UUID string) in a
      // column confusingly named "deviceId" — not the numeric id.
      if (externalIds.length) {
        await manager.query(
          `DELETE FROM certificate_read_model WHERE "deviceId" = ANY($1::text[])`,
          [externalIds],
        );
        await manager.query(
          `DELETE FROM issuer_certificate WHERE "deviceId" = ANY($1::text[])`,
          [externalIds],
        );
        await manager.query(
          `DELETE FROM issuer_certification_request WHERE "deviceId" = ANY($1::text[])`,
          [externalIds],
        );
        await manager.query(
          `DELETE FROM old_issuer_certificate WHERE "deviceId" = ANY($1::text[])`,
          [externalIds],
        );
      }
      // submissions joined by siteName slug (matches attachReviewStatus pattern)
      if (slugs.length) {
        await manager.query(
          `DELETE FROM submissions
            WHERE regexp_replace(project_subfolder,
                  '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                  '', 'i') = ANY($1::text[])`,
          [slugs],
        );
      }
      // chat threads tied to this site. chat_conversations.headUuid has
      // ON DELETE CASCADE so deleting head chats wipes the conversation;
      // we also walk the linked list via nextEntryUuid to scrub every
      // chat message belonging to those threads.
      if (siteNames.length) {
        await manager.query(
          `WITH RECURSIVE chain AS (
             SELECT c."headUuid" AS uuid
               FROM chat_conversations c
              WHERE c."deviceSiteName" = ANY($1::text[])
             UNION
             SELECT n."nextEntryUuid"
               FROM chats n
               JOIN chain ch ON n.uuid = ch.uuid
              WHERE n."nextEntryUuid" IS NOT NULL
           )
           DELETE FROM chats WHERE uuid IN (SELECT uuid FROM chain WHERE uuid IS NOT NULL)`,
          [siteNames],
        );
        // Sweep any orphaned conversation rows (e.g. a conversation
        // whose head chat was already gone, leaving the conversation
        // pointer dangling). The FK has ON DELETE CASCADE so the chat
        // deletes above usually clean them up, but be explicit.
        await manager.query(
          `DELETE FROM chat_conversations WHERE "deviceSiteName" = ANY($1::text[])`,
          [siteNames],
        );
      }
      await manager.query(
        `DELETE FROM device WHERE id = ANY($1::int[])`,
        [deviceIds],
      );
    });

    // S3 cleanup runs after commit; failures are logged but non-fatal.
    let deletedDocuments = 0;
    try {
      deletedDocuments = await this.documentsService.deleteAllByDevices(deviceIds);
    } catch (err) {
      this.logger.error(`bulkRemove: S3/doc cleanup error: ${(err as Error).message}`);
    }

    return {
      success: true,
      deletedDevices: deviceIds.length,
      deletedDocuments,
      skipped,
    };
  }

  async updateLateCycleCheckedAt(groupId: number): Promise<any> {
    await this.lateDeviceCertificateRepository.update(
      { groupId: groupId, certificate_issued: false },
      { checked_at: new Date() },
    );
  }

  @Profile()
  async updateLateOngoing(externalId: string, id: number): Promise<any> {
    this.logger.verbose(`With in updatelateongoing`);
    this.logger.verbose(`With in updatelateongoing`, id);
    return await this.lateDeviceCertificateRepository.update(
      { id: id, device_externalid: externalId },
      { certificate_issued: true },
    );
  }

  async updateLateOngoingIfReservationInactive(
    externalId: string,
  ): Promise<any> {
    this.logger.verbose(`With in updatelateongoingIfReservationInactive`);
    this.logger.verbose(
      `With in updatelateongoingIfReservationInactive`,
      externalId,
    );
    return await this.lateDeviceCertificateRepository.update(
      { device_externalid: externalId },
      { certificate_issued: true },
    );
  }

  @Profile()
  async archiveLateOngoing(id: number): Promise<any> {
    this.logger.verbose(`With in archiveLateOngoing`);
    this.logger.verbose(`With in archiveLateOngoing`, id);
    return await this.lateDeviceCertificateRepository.update(
      { id: id },
      { archived_at: new Date() },
    );
  }

  @Profile()
  async archiveLateOngoingIfReservationInactive(groupId: number): Promise<any> {
    this.logger.verbose(`With in archiveLateOngoingIfReservationInactive`);
    this.logger.verbose(
      `With in archiveLateOngoingIfReservationInactive`,
      groupId,
    );
    return await this.lateDeviceCertificateRepository.update(
      { groupId: groupId, certificate_issued: false },
      { archived_at: new Date() },
    );
  }

  /**
   * Finds a late device certificate cycle for a specific date range
   *
   * @param groupId - The ID of the device group
   * @param deviceExternalId - The external ID of the device
   * @param cycleStartDate - The start date of the cycle period
   * @param cycleEndDate - The end date of the cycle period
   * @returns Promise resolving to the matching cycle entity or undefined if not found
   */
  @Profile()
  public async findLateCycleByDateRange(
    groupId: number,
    deviceExternalId: string,
    cycleStartDate: DateTime,
    cycleEndDate: DateTime,
  ): Promise<DeviceLateOngoingIssueCertificateEntity | undefined> {
    return this.lateDeviceCertificateRepository.findOne({
      where: {
        groupId: groupId,
        device_externalid: deviceExternalId,
        late_start_date: cycleStartDate.toString(),
        late_end_date: cycleEndDate.toString(),
      },
    });
  }

  /**
   * Finds an existing device cycle by date range or creates a new one if none exists
   *
   * @param groupId - The ID of the device group
   * @param deviceExternalId - The external ID of the device
   * @param startDate - The start date of the cycle period
   * @param endDate - The end date of the cycle period
   * @returns Promise resolving to the existing or newly created cycle entity
   */
  @Profile()
  public async findOrCreateCycle(
    groupId: number,
    deviceExternalId: string,
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<DeviceLateOngoingIssueCertificateEntity> {
    // Search for an existing cycle with these parameters
    const existingCycle = await this.findLateCycleByDateRange(
      groupId,
      deviceExternalId,
      startDate,
      endDate,
    );

    // Return existing cycle if found
    if (existingCycle) {
      return existingCycle;
    }

    // Create and return a new cycle
    return this.createCycle(groupId, deviceExternalId, startDate, endDate);
  }

  public async findCycleByDateRange(
    groupId: number,
    deviceExternalId: string,
    cycleStartDate: DateTime,
    cycleEndDate: DateTime,
    frequency: string = CertificateGenerationFrequency.daily,
  ): Promise<DeviceLateOngoingIssueCertificateEntity | undefined> {
    const startDate = getMinDateByFrequency(cycleStartDate, frequency);
    const endDate = getMaxDateByFrequency(cycleEndDate, frequency);
    return this.lateDeviceCertificateRepository.findOne({
      where: {
        groupId: groupId,
        device_externalid: deviceExternalId,
        late_start_date: MoreThanOrEqual(startDate.toString()),
        late_end_date: LessThanOrEqual(endDate.toString()),
      },
    });
  }

  /**
   * Adds a new late ongoing certificate issuance cycle for a device
   *
   * @param groupId - The ID of the device group
   * @param deviceExternalId - The external ID of the device
   * @param lateStartDate - The start date for the late issuance cycle
   * @param lateEndDate - The end date for the late issuance cycle
   * @returns Promise resolving to the created certificate cycle entity
   */
  @Profile()
  public async createCycle(
    groupId: number,
    deviceExternalId: string,
    lateStartDate: Date | string | DateTime,
    lateEndDate: Date | string | DateTime,
  ): Promise<DeviceLateOngoingIssueCertificateEntity> {
    this.logger.debug(
      `Creating late cycle for device: ${deviceExternalId}, group: ${groupId}`,
    );

    // Create and populate the entity
    const cycleEntity = new DeviceLateOngoingIssueCertificateEntity();
    cycleEntity.device_externalid = deviceExternalId;
    cycleEntity.groupId = groupId;
    cycleEntity.late_start_date = lateStartDate.toString();
    cycleEntity.late_end_date = lateEndDate.toString();

    // Persist the entity
    const savedEntity =
      await this.addLateCertificateIssueDateLogForDevice(cycleEntity);

    this.logger.debug(
      `Created late cycle ID: ${savedEntity.id} for device: ${deviceExternalId}`,
    );
    return savedEntity;
  }

  /**
   * Checks for and fills any missing cycles for a device
   *
   * @param group - The device group
   * @param device - The device to check for missing cycles
   * @returns Promise resolving when all missing cycles are processed
   */
  public async checkForDeviceMissingCycles(
    group: DeviceGroup,
    device: Device,
    startDate: Date,
  ): Promise<void> {
    // Get cycle boundaries
    const reservationEndDate = new Date(group.reservationEndDate);
    const now = new Date();

    const cycleEnd = reservationEndDate > now ? now : reservationEndDate;

    const deviceCreationDate = new Date(device.createdAt);

    // Iterate through time periods to find and fill gaps
    let currentDate = new Date(startDate);

    while (currentDate < cycleEnd) {
      // Calculate the next date based on frequency
      const nextDate = getCycleEndDate(currentDate, group.frequency);

      // Determine the actual end date (earlier of calculated end or boundary end)
      const actualEndDate =
        nextDate < reservationEndDate ? nextDate : reservationEndDate;

      if (currentDate < deviceCreationDate) {
        currentDate = actualEndDate;
        continue;
      }

      if (actualEndDate > cycleEnd) {
        break; // Stop if we exceed the cycle end date
      }

      const existingCycle = await this.findCycleByDateRange(
        group.id,
        device.externalId,
        DateTime.fromJSDate(currentDate).toUTC(),
        DateTime.fromJSDate(actualEndDate).toUTC(),
        group.frequency,
      );

      if (!existingCycle) {
        // Create cycle if it doesn't exist
        await this.createCycle(
          group.id,
          device.externalId,
          DateTime.fromJSDate(currentDate).toUTC(),
          DateTime.fromJSDate(actualEndDate).toUTC(),
        );
      }

      // Move to next period
      currentDate = existingCycle?.lateEndDate || actualEndDate;
    }
  }

  /**
   * Retrieves the most recently issued certificate cycles for each unique device-group combination
   *
   * @returns Promise resolving to an array of the latest issued certificate cycles
   */
  async findLatestIssuedCyclesByDeviceAndGroup(): Promise<any> {
    return this.lateDeviceCertificateRepository
      .createQueryBuilder('cycle')
      .distinctOn(['cycle.device_externalid', 'cycle.groupId'])
      .where('cycle.certificate_issued = :issued', { issued: true })
      .andWhere('cycle.archived_at IS NULL')
      .orderBy('cycle.device_externalid', 'ASC')
      .addOrderBy('cycle.groupId', 'ASC')
      .addOrderBy('cycle.late_end_date', 'DESC')
      .getMany();
  }

  /**
   * Archives all outdated certificate cycles for a specific device-group combination
   *
   * @param cycle - The reference cycle used to determine which older cycles to archive
   * @returns Promise resolving when the update operation completes
   */
  @Profile()
  async archiveOutdatedLateOngoingCycles(
    cycle: DeviceLateOngoingIssueCertificateEntity,
  ): Promise<any> {
    await this.lateDeviceCertificateRepository.update(
      {
        device_externalid: cycle.device_externalid,
        groupId: cycle.groupId,
        certificate_issued: false,
        late_end_date: LessThanOrEqual(cycle.late_start_date),
        archived_at: null,
      },
      {
        archived_at: new Date(),
      },
    );
  }

  async updateEvidentInfo(
    deviceExternalId: string,
    evidentDeviceId: string,
    evidentStatus: EvidentRegistrationStatus,
  ): Promise<void> {
    this.logger.verbose(`With in updateDeviceEvidentInfo`);
    const device = await this.repository.findOne({
      where: {
        externalId: deviceExternalId,
      },
    });
    if (!device) {
      this.logger.error(
        `Device not found with externalId: ${deviceExternalId}`,
      );
      throw new NotFoundException(
        `Device not found with externalId: ${deviceExternalId}`,
      );
    }
    device.evidentDeviceId = evidentDeviceId;
    device.evidentStatus = evidentStatus;
    await this.repository.save(device);
    this.logger.log(`Updated evident_device_id and evident_status for devices`);
  }

  async updateCertificateLogEvidentDetails(
    id: number,
    issuanceId: string,
    status: EvidentIssuanceStatus,
  ): Promise<any> {
    const now = new Date();
    return await this.checkDeviceLogCertificateRepository.update(
      {
        id: id,
      },
      {
        evidentSyncedAt: now.toISOString(),
        evidentIssuanceRequestId: issuanceId,
        evidentIssuanceRequestStatus: status,
      },
    );
  }

  async getCertificatesForEvidentIssuance(
    organizationId: number,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    return await this.checkDeviceLogCertificateRepository
      .createQueryBuilder('deviceCertificates')
      .leftJoinAndSelect('deviceCertificates.device', 'device')
      .leftJoinAndSelect('device.organization', 'organization')
      .leftJoinAndSelect('organization.evidentSettings', 'evidentSettings')
      .where('deviceCertificates.evidentSyncedAt IS NULL')
      .andWhere(
        'deviceCertificates.certificate_issuance_startdate >= device.createdAt',
      )
      .andWhere('evidentSettings.apiKey IS NOT NULL')
      .andWhere('evidentSettings.apiKey != :empty', { empty: '' })
      .andWhere('device.evidentStatus = :status', {
        status: EvidentRegistrationStatus.Approved,
      })
      .andWhere('deviceCertificates.ongoing_start_date IS NOT NULL') // Returning only delta reads
      .andWhere('organization.id = :organizationId', { organizationId })
      .orderBy('deviceCertificates.certificate_issuance_startdate', 'ASC')
      .getMany();
  }

  async getCertificatesByGroupForEvidentIssuance(
    groupId: number,
    certificateTransactionUIDs: string[],
  ): Promise<DeviceGroupCertificatesAggregate[]> {
    const rawRows = await this.checkDeviceLogCertificateRepository
      .createQueryBuilder('c')
      .innerJoin('c.device', 'd')
      .where('c.groupId = :groupId', { groupId })
      .andWhere('c.certificateTransactionUID IN (:...uids)', {
        uids: certificateTransactionUIDs,
      })
      .select('d')
      .addSelect('MIN(c.certificate_issuance_startdate)', 'min_start_date')
      .addSelect('MAX(c.certificate_issuance_enddate)', 'max_end_date')
      .addSelect('SUM(c.readvalue_watthour)', 'amount') // <-- added sum
      .groupBy('d.id')
      .orderBy('min_start_date', 'ASC')
      .getRawMany();

    return rawRows.map((r) =>
      Object.entries(r).reduce(
        (acc, [k, v]) => {
          k.startsWith('d_') ? (acc.device[k.slice(2)] = v) : (acc[k] = v);
          return acc;
        },
        {
          device: {} as Device,
          min_start_date: '' as string,
          max_end_date: '' as string,
          amount: 0 as number,
        } satisfies DeviceGroupCertificatesAggregate,
      ),
    );
  }

  async getCertificatesBySinglePathWayForEvidentIssuance(
    groupIds: number[],
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    return await this.checkDeviceLogCertificateRepository
      .createQueryBuilder('deviceCertificates')
      .leftJoinAndSelect('deviceCertificates.device', 'device')
      .leftJoinAndSelect('device.organization', 'organization')
      .innerJoin(DeviceGroup, 'dg', 'dg.id = deviceCertificates.groupId')
      .where('deviceCertificates.groupId IN (:...groupIds)', { groupIds })
      .andWhere('deviceCertificates.evidentSyncedAt IS NULL')
      .andWhere(
        'deviceCertificates.certificate_issuance_startdate > dg.reservationStartDate',
      )
      .andWhere('device.evidentStatus = :status', {
        status: EvidentRegistrationStatus.Submitted,
      })
      .andWhere('organization.id = dg.organizationId')
      .orderBy('deviceCertificates.certificate_issuance_startdate', 'ASC')
      .getMany();
  }

  /**
   * §3.3.3: Documents are immutable once the device review is approved.
   */
  async assertDocumentsEditable(deviceId: number): Promise<void> {
    const rows: any[] = await this.connection.query(
      `SELECT s.status
       FROM submissions s
       JOIN device d ON regexp_replace(lower(d."siteName"), '[^a-z0-9]+', '-', 'g')
         = regexp_replace(s.project_subfolder,
             '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
             '', 'i')
       WHERE d.id = $1`,
      [deviceId],
    );
    if (rows.length > 0 && rows[0].status === 'approved') {
      throw new ForbiddenException(
        'Documents cannot be modified after the device review has been approved',
      );
    }
  }
}
