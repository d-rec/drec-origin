import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { OrgApiLicensesService, ServiceType } from './org-api-licenses.service';
import { Role } from '../../utils/enums/role.enum';

const REVIEWER_ROLES: Role[] = [Role.Admin, Role.Reviewer, Role.SeniorReviewer];

@Injectable()
export class ApiKeyResolverService {
  private readonly logger = new Logger(ApiKeyResolverService.name);

  constructor(private readonly orgApiLicensesService: OrgApiLicensesService) {}

  async resolveDeeplKey(user: {
    role: Role;
    organizationId: number;
  }): Promise<string> {
    // Reviewers always use the platform (Admin org) key, no credit check
    if (REVIEWER_ROLES.includes(user.role)) {
      return this.getPlatformDeeplKey();
    }

    let license = await this.orgApiLicensesService.findDecrypted(
      user.organizationId,
    );

    // Lazy-create the license row so the freebie cap applies
    if (!license) {
      await this.orgApiLicensesService.initializeCredits(user.organizationId);
      license = await this.orgApiLicensesService.findDecrypted(
        user.organizationId,
      );
    }

    // Org has their own key — use it, no credit check
    if (license?.deeplApiKey) {
      return license.deeplApiKey;
    }

    // Platform key with credit deduction
    const ok = await this.orgApiLicensesService.deductCredit(
      user.organizationId,
      'deepl',
    );
    if (!ok) {
      throw new ForbiddenException(
        'DeepL credits exhausted. Please add your own API key in Organization > Licenses.',
      );
    }

    return this.getPlatformDeeplKey();
  }

  async resolveRoboflowKey(user: {
    role: Role;
    organizationId: number;
  }): Promise<{ url: string; key: string }> {
    // Reviewers always use the platform (Admin org) key
    if (REVIEWER_ROLES.includes(user.role)) {
      return this.getPlatformRoboflowKey();
    }

    let license = await this.orgApiLicensesService.findDecrypted(
      user.organizationId,
    );

    // Lazy-create the license row so the freebie cap applies
    if (!license) {
      await this.orgApiLicensesService.initializeCredits(user.organizationId);
      license = await this.orgApiLicensesService.findDecrypted(
        user.organizationId,
      );
    }

    // Org has their own key (and optionally their own workflow URL)
    if (license?.roboflowApiKey) {
      const platformKeys =
        await this.orgApiLicensesService.findAdminOrgDecrypted();
      return {
        url:
          license.roboflowWorkflowUrl || platformKeys.roboflowWorkflowUrl || '',
        key: license.roboflowApiKey,
      };
    }

    // Platform key with credit deduction
    const ok = await this.orgApiLicensesService.deductCredit(
      user.organizationId,
      'roboflow',
    );
    if (!ok) {
      throw new ForbiddenException(
        'Roboflow credits exhausted. Please add your own API key in Organization > Licenses.',
      );
    }

    return this.getPlatformRoboflowKey();
  }

  async getCreditsInfo(
    organizationId: number,
    service: ServiceType,
  ): Promise<{ credits: number; hasOwnKey: boolean }> {
    const credits = await this.orgApiLicensesService.getCredits(organizationId);
    const hasOwnKey = await this.orgApiLicensesService.hasOwnKey(
      organizationId,
      service,
    );
    return {
      credits: service === 'roboflow' ? credits.roboflow : credits.deepl,
      hasOwnKey,
    };
  }

  private async getPlatformDeeplKey(): Promise<string> {
    const adminKeys = await this.orgApiLicensesService.findAdminOrgDecrypted();
    if (!adminKeys.deeplApiKey) {
      throw new ForbiddenException(
        'Translation is not configured. An admin must set the DeepL API key in Organization > Licenses.',
      );
    }
    return adminKeys.deeplApiKey;
  }

  private async getPlatformRoboflowKey(): Promise<{
    url: string;
    key: string;
  }> {
    const adminKeys = await this.orgApiLicensesService.findAdminOrgDecrypted();
    if (!adminKeys.roboflowApiKey) {
      throw new ForbiddenException(
        'Panel detection is not configured. An admin must set the Roboflow API key in Organization > Licenses.',
      );
    }
    return {
      url: adminKeys.roboflowWorkflowUrl || '',
      key: adminKeys.roboflowApiKey,
    };
  }
}
