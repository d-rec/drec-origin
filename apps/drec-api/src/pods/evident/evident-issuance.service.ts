import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EvidentService } from './evident.service';
import { EvidentIssuanceRequest, EvidentIssuanceStatus } from '../../types/evident';

@Injectable()
export class EvidentIssuanceService {
  private readonly logger = new Logger(EvidentIssuanceService.name);
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID || null;

  constructor(private readonly evidentService: EvidentService) {
  }

  async create(
    organizationId: number,
    code: string,
    issuance: EvidentIssuanceRequest,
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
      console.log('response', response.data);
      const registrantId = profile.member.uid;
      await this.saveDetails(
        organizationId,
        response.data,
        registrantId,
        issuance,
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

  async saveDetails(
    organizationId: number,
    data: any, // TODO: define the type
    registrantId: string,
    issuance: EvidentIssuanceRequest,
  ): Promise<any> {
    const evidentInstance =
      await this.evidentService.getApiInstance(organizationId);
    try {

      let uploadedFiles = [];

      if (issuance.files) {
        uploadedFiles = await this.uploadFiles(
          issuance.files,
          organizationId,
          registrantId,
          issuance.notes,
        );
      }
      //   01JWE2T7514TEC15D68JSJSPC1
      const details = await evidentInstance.post('/issue_details', {
        files: [uploadedFiles],
        endDate: issuance.endDate,
        fuel: issuance.fuel,
        issue: data['@id'],
        notes: issuance.notes,
        productionVolume: issuance.productionVolume,
        recipientAccount: issuance.recipientAccount,
        startDate: issuance.startDate,
        status: EvidentIssuanceStatus.Draft,
      });
      console.log('details in success', details);
      return details;
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw error;
    }
  }

  private async uploadFiles(files: Express.Multer.File[] | Express.Multer.File, organizationId: number, registrantId: string, notes? = ''): Promise<string[]> {
    const uploadedFileReferences: string[] = [];
    const filesToUpload = Array.isArray(files)
      ? files
      : [files];

    for (const filePath of filesToUpload) {
      const fileReference = await this.evidentService.uploadFile(
        { organizationId },
        registrantId,
        filePath,
        notes,
      );
      uploadedFileReferences.push(fileReference);
    }

    return uploadedFileReferences;
  }
}
