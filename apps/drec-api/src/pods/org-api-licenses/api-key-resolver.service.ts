import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { OrgApiLicensesService, ServiceType } from './org-api-licenses.service';
import { Role } from '../../utils/enums/role.enum';

const REVIEWER_ROLES: Role[] = [Role.Admin, Role.Reviewer, Role.SeniorReviewer];

@Injectable()
export class ApiKeyResolverService {
  private readonly logger = new Logger(ApiKeyResolverService.name);

  constructor(
    private readonly orgApiLicensesService: OrgApiLicensesService,
  ) {}

  async resolveDeeplKey(user: {
    role: Role;
    organizationId: number;
  }): Promise<string> {
    // Reviewers always use the platform key, no credit check
    if (REVIEWER_ROLES.includes(user.role)) {
      return this.getPlatformDeeplKey();
    }

    const license = await this.orgApiLicensesService.findDecrypted(
      user.organizationId,
    );

    // No license row (dev mode) — use platform key directly
    if (!license) {
      return this.getPlatformDeeplKey();
    }

    // Org has their own key — use it, no credit check
    if (license.deeplApiKey) {
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
    const platformResult = {
      url: process.env.ROBOFLOW_WORKFLOW_URL!,
      key: process.env.ROBOFLOW_API_KEY!,
    };

    // Reviewers always use the platform key
    if (REVIEWER_ROLES.includes(user.role)) {
      return platformResult;
    }

    const license = await this.orgApiLicensesService.findDecrypted(
      user.organizationId,
    );

    // No license row (dev mode) — use platform key directly
    if (!license) {
      return platformResult;
    }

    // Org has their own key
    if (license.roboflowApiKey) {
      return {
        url: process.env.ROBOFLOW_WORKFLOW_URL!,
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

    return platformResult;
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

  private getPlatformDeeplKey(): string {
    const key = process.env.DEEPL_API_KEY;
    if (!key) {
      throw new ForbiddenException('Translation is not configured');
    }
    return key;
  }
}
