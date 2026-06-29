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

    // Dev mode: bypass the credit limit. Set MODE=dev in .env.
    if ((process.env.MODE || '').toLowerCase() === 'dev') {
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

    // Dev mode bypasses the credit limit so testing doesn't hit the freebie
    // cap. Set MODE=dev in .env to enable.
    if ((process.env.MODE || '').toLowerCase() === 'dev') {
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

  async resolveAnthropicKey(user: {
    role: Role;
    organizationId: number;
  }): Promise<string> {
    if (REVIEWER_ROLES.includes(user.role)) {
      return this.getPlatformAnthropicKey();
    }
    if ((process.env.MODE || '').toLowerCase() === 'dev') {
      return this.getPlatformAnthropicKey();
    }

    let license = await this.orgApiLicensesService.findDecrypted(
      user.organizationId,
    );
    if (!license) {
      await this.orgApiLicensesService.initializeCredits(user.organizationId);
      license = await this.orgApiLicensesService.findDecrypted(
        user.organizationId,
      );
    }

    if (license?.anthropicApiKey) {
      return license.anthropicApiKey;
    }

    const ok = await this.orgApiLicensesService.deductCredit(
      user.organizationId,
      'anthropic',
    );
    if (!ok) {
      throw new ForbiddenException(
        'Claude credits exhausted. Please add your own Anthropic API key in Organization > Licenses.',
      );
    }
    return this.getPlatformAnthropicKey();
  }

  async getCreditsInfo(
    organizationId: number,
    service: ServiceType,
  ): Promise<{
    credits: number;
    hasOwnKey: boolean;
    platformKeyConfigured: boolean;
  }> {
    const credits = await this.orgApiLicensesService.getCredits(organizationId);
    const hasOwnKey = await this.orgApiLicensesService.hasOwnKey(
      organizationId,
      service,
    );
    const adminKeys = await this.orgApiLicensesService.findAdminOrgDecrypted();
    const platformKey =
      service === 'roboflow'
        ? adminKeys.roboflowApiKey
        : service === 'deepl'
          ? adminKeys.deeplApiKey
          : adminKeys.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY ?? null;
    const credit =
      service === 'roboflow'
        ? credits.roboflow
        : service === 'deepl'
          ? credits.deepl
          : credits.anthropic;
    return { credits: credit, hasOwnKey, platformKeyConfigured: !!platformKey };
  }

  private async getPlatformAnthropicKey(): Promise<string> {
    const adminKeys = await this.orgApiLicensesService.findAdminOrgDecrypted();
    // Fall back to env so the platform key works even before an Admin
    // has saved it via the licenses page (e.g. dev / fresh install).
    const key = adminKeys.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new ForbiddenException(
        'Claude classification is not configured. An admin must set the Anthropic API key in Organization > Licenses.',
      );
    }
    return key;
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
