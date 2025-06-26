import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createEvidentAxiosInstance } from '../../lib/evident';
import { decrypt } from '../../utils/crypto';
import { EvidentSettings } from './evident-settings.entity';
import { Issuer } from './evident-issuer';
import FormData from 'form-data';
import * as fs from 'fs';
import { promisify } from 'util';
import { EvidentSettingsService } from './evident-settings.service';
import { AxiosInstance } from 'axios';

@Injectable()
export class EvidentService {
  private readonly logger = new Logger(EvidentService.name);
  private apiUrl = process.env.IREC_EVIDENT_API_URL || null;

  constructor(
    private readonly evidentSettingsService: EvidentSettingsService,
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
  private async uploadFileToEvident(
    organizationId: number,
    registrantId: string,
    filePath: string,
  ): Promise<string> {
    try {
      const evidentInstance = await this.getApiInstance(organizationId);

      const readFile = promisify(fs.readFile);
      const fileBuffer = await readFile(filePath);
      const fileName = filePath.split('/').pop();

      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'text/csv',
      });
      form.append('name', fileName);
      form.append('notes', '');
      form.append('userUid', registrantId);
      form.append('category', '');
      const response = await evidentInstance.post('/files', form, {
        headers: {
          ...form.getHeaders(),
        },
      });

      this.logger.log(`📤 File uploaded successfully: ${fileName}`);
      return response.data['@id'];
    } catch (error) {
      this.logger.error('❌ Failed to upload file to Evident:', error);
      throw error;
    }
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
      };
    } catch (error) {
      this.logger.error('Error fetching registrant info:', error);
      throw error;
    }
  }

  async registerIssuance(
    organizationId: number,
    code: string,
    issuer: Issuer,
  ): Promise<any> {
    try {
      const evidentInstance = await this.getApiInstance(organizationId);

      const response = await evidentInstance.post('/issues', {
        device: `/devices/${code}`,
      });
      console.log('registered issueance succefully');
      await this.registerIssuanceDetails(organizationId, response.data, issuer);

      console.log('reached');
      return response.data;
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw new BadRequestException(
        error.response?.data?.['hydra:description'],
      );
    }
  }

  async registerIssuanceDetails(
    organizationId: number,
    data: any,
    issuer: Issuer,
  ): Promise<any> {
    const evidentInstance = await this.getApiInstance(organizationId);
    try {
      const uploadedFileReferences: string[] = [];

      if (issuer.files) {
        const filesToUpload = Array.isArray(issuer.files)
          ? issuer.files
          : [issuer.files];

        for (const filePath of filesToUpload) {
          const fileReference = await this.uploadFileToEvident(
            organizationId,
            '01JWE2T7514TEC15D68JSJSPC1',
            filePath,
          );
          uploadedFileReferences.push(fileReference);
        }
      }

      const details = await evidentInstance.post('/issue_details', {
        files: uploadedFileReferences,
        endDate: issuer.endDate,
        fuel: issuer.fuel,
        issue: data['@id'],
        issuerNotes: '',
        notes: issuer.notes,
        productionVolume: issuer.productionVolume,
        recipientAccount: issuer.recipientAccount,
        startDate: issuer.startDate,
        status: 'Draft',
      });
      console.log('details in success', details);
      return details;
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw error;
    }
  }
}
