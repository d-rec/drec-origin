import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import FormData from 'form-data';
import * as fs from 'fs';
import { promisify } from 'util';
import { EvidentService } from './evident.service';
import { Issuer } from './evident-issuer';
@Injectable()
export class EvidentIssuanceService {
  private readonly logger = new Logger(EvidentIssuanceService.name);
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID || null;

  constructor(private readonly evidentService: EvidentService) {}

  private async uploadFileToEvident(
    organizationId: number,
    registrantId: string,
    filePath: string,
  ): Promise<string> {
    try {
      const evidentInstance =
        await this.evidentService.getApiInstance(organizationId);

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
  async registerIssuance(
    organizationId: number,
    code: string,
    issuer: Issuer,
  ): Promise<any> {
    try {
      const evidentInstance =
        await this.evidentService.getApiInstance(organizationId);

      const response = await evidentInstance.post('/issues', {
        device: `/devices/${code}`,
      });
      console.log('registered issueance succefully');
      const profile =
        await this.evidentService.getRegistrantInfo(organizationId);
        console.log("response",response.data)
      const registrantId = profile.member.uid;
      await this.registerIssuanceDetails(
        organizationId,
        response.data,
        registrantId,
        issuer,
      );

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
    registrantId: string,
    issuer: Issuer,
  ): Promise<any> {
    const evidentInstance =
      await this.evidentService.getApiInstance(organizationId);
    try {
      const uploadedFileReferences: string[] = [];

    //   if (issuer.files) {
    //     const filesToUpload = Array.isArray(issuer.files)
    //       ? issuer.files
    //       : [issuer.files];

    //     for (const filePath of filesToUpload) {
    //       const fileReference = await this.uploadFileToEvident(
    //         organizationId,
    //         registrantId,
    //         filePath,
    //       );
    //       uploadedFileReferences.push(fileReference);
    //     }
    //   }
      //   01JWE2T7514TEC15D68JSJSPC1
      const details = await evidentInstance.post('/issue_details', {
        files: [uploadedFileReferences],
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
