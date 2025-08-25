import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { createEvidentAxiosInstance } from '../../lib/evident';
import { EvidentSettingsService } from './evident-settings.service';
import { AxiosInstance } from 'axios';
import { Device } from '../device/device.entity';
import getFileData from '../../lib/helpers/getFileData';
import FormData from 'form-data';
import { DocumentType } from '../document-uploads/entities/documents.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EvidentIssuersEntity } from './evident-issuers.entity';
import { Repository } from 'typeorm';
import { EvidentIssuersDTO } from './evident-issuers.dto';
import { DeviceGroup } from '../device-group/device-group.entity';
import { findCountryByCode } from '../../utils/get-country';

@Injectable()
export class EvidentService {
  private readonly logger = new Logger(EvidentService.name);
  private apiUrl = process.env.IREC_EVIDENT_API_URL || null;

  constructor(
    private readonly evidentSettingsService: EvidentSettingsService,
    @InjectRepository(EvidentIssuersEntity)
    private readonly issuerRepository: Repository<EvidentIssuersEntity>,
  ) {}

  async getApiInstance(organizationId: number): Promise<AxiosInstance> {
    const data = await this.evidentSettingsService.find(organizationId);
    if (!data)
      throw new Error(
        `Evident instance not found for organization ${organizationId}`,
      );
    return createEvidentAxiosInstance({
      baseURL: this.apiUrl,
      apiKey: data.apiKey,
      organizationId: organizationId.toString(),
    });
  }

  async getRegistrantInfo(organizationId: number): Promise<any> {
    try {
      const evidentApiInstance = await this.getApiInstance(organizationId);
      const evidentSettings =
        await this.evidentSettingsService.find(organizationId);
      const user = await evidentApiInstance.get(
        `/users?q=${evidentSettings.email}`,
      );
      const userMember = user.data['hydra:member'][0];
      return {
        profile: user,
        member: userMember,
        id: userMember.uid,
        registrantId: userMember.organisation.uid,
      };
    } catch (error) {
      this.logger.error('Error fetching registrant info:', error);
      throw error;
    }
  }

  async uploadFiles(
    device: Device | DeviceGroup,
    files: Record<string, Express.Multer.File[]>,
    evidentUserId: string,
    notes = '',
  ): Promise<string[]> {
    const filesToUpload = [];
    for (const [documentType, fileArray] of Object.entries(files)) {
      if (!Array.isArray(fileArray)) continue;
      for (const file of fileArray) {
        filesToUpload.push({
          file,
          documentType: documentType as DocumentType,
        });
      }
    }
    const uploadedFiles = await Promise.all(
      filesToUpload.map(({ file, documentType }) =>
        this.uploadFile(device, evidentUserId, file, notes, documentType),
      ),
    );
    return uploadedFiles
      .filter((result) => result.success && result.fileId)
      .map((result) => result.fileId);
  }

  async uploadFile(
    device: Device | DeviceGroup,
    evidentUserId: string,
    file: Express.Multer.File,
    notes: string,
    documentType?: DocumentType,
  ): Promise<any> {
    try {
      if (!file) {
        return {
          success: false,
          error: 'No file provided for upload',
        };
      }

      const evidentApiInstance = await this.getApiInstance(
        device.organizationId,
      );
      const fileData = getFileData(file);
      const form = new FormData();

      form.append('file', fileData, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      form.append('name', file.originalname);
      form.append('notes', notes);
      form.append('userUid', evidentUserId);
      form.append('category', documentType);

      const uploadedFile = await evidentApiInstance.post('/files', form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return {
        success: true,
        data: uploadedFile.data,
        fileId: uploadedFile.data?.['@id'],
      };
    } catch (error) {
      this.logger.error(
        'Failed to upload file:',
        error.response?.data || error.message,
      );

      return {
        success: false,
        error:
          error.response?.data?.message || error.message || 'Upload failed',
      };
    }
  }

  async getIssuerByCountry(organizationId, country: string): Promise<any> {
    const evidentInstance = await this.getApiInstance(organizationId);
    return await evidentInstance.get(
      `/organisations?pagination=false&q=${country}&roles=issuer`,
    );
  }

  async registerIssuer(
    createIssuerDTO: EvidentIssuersDTO,
  ): Promise<EvidentIssuersEntity> {
    this.logger.verbose(`With in registerIssuer`);
    try {
      const existingIssuer = await this.issuerRepository.findOne({
        where: [
          { email: createIssuerDTO.email },
          { issuerId: createIssuerDTO.issuerId },
        ],
      });
      if (existingIssuer) {
        if (existingIssuer.email === createIssuerDTO.email) {
          throw new ConflictException(
            `Issuer with email ${createIssuerDTO.email} already exists`,
          );
        }
        if (existingIssuer.issuerId === createIssuerDTO.issuerId) {
          throw new ConflictException(
            `Issuer with ID ${createIssuerDTO.issuerId} already exists`,
          );
        }
      }
      return await this.issuerRepository.save(createIssuerDTO);
    } catch (error) {
      this.logger.error('caught exception in registerIssuer', error);
      throw error;
    }
  }

  async getIssuers(page: number, limit: number) {
    const [data, total] = await this.issuerRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    data?.forEach((issuer) => {
      issuer.country = findCountryByCode(issuer.country).country;
      issuer.regions = issuer.regions.map((regionCode) => {
        return findCountryByCode(regionCode).country;
      });
    });
    return { data, total };
  }
}
