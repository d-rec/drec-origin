import { Test, TestingModule } from '@nestjs/testing';
import { DrecModule } from './drec.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './pods/user/user.entity';
import { Device } from './pods/device/device.entity';
import { Organization } from './pods/organization/organization.entity';
import { UserRole } from './pods/user/user_role.entity';
import { Invitation } from './pods/invitation/invitation.entity';
import { EmailConfirmation } from './pods/email-confirmation/email-confirmation.entity';
import { YieldConfig } from './pods/yield-config/yieldconfig.entity';
import { AClModules } from './pods/access-control-layer-module-service/aclmodule.entity';
import { ACLModulePermissions } from './pods/permission/permission.entity';
import { DeviceCsvFileProcessingJobsEntity } from './pods/device-group/device_csv_processing_jobs.entity';
import { DeviceCsvProcessingFailedRowsEntity } from './pods/device-group/device_csv_processing_failed_rows.entity';
import { DeviceGroupNextIssueCertificate } from './pods/device-group/device_group_issuecertificate.entity';
import { AggregateMeterRead } from './pods/reads/aggregate_readvalue.entity';
import { HistoryIntermediate_MeterRead } from './pods/reads/history_intermideate_meterread.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from './pods/device/check_certificate_issue_date_log_for_device.entity';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from './pods/device-group/check_certificate_issue_date_log_for_device_group.entity';
import { SdgBenefit } from './pods/sdgbenefit/sdgbenefit.entity';
import { DeltaFirstRead } from './pods/reads/delta_firstread.entity';
import { IrecDevicesInformationEntity } from './pods/device/irec_devices_information.entity';
import { IrecErrorLogInformationEntity } from './pods/device/irec_error_log_information.entity';
import { UserLoginSessionEntity } from './pods/user/user_login_session.entity';
import { DeviceLateongoingIssueCertificateEntity } from './pods/device/device_lateongoing_certificate.entity';
import { CertificateLogModule } from './pods/certificate-log/certificate-log.module';
import { SdgbenefitModule } from './pods/sdgbenefit/sdgbenefit.module';
import { CountrycodeModule } from './pods/countrycode/countrycode.module';
import { PermissionModule } from './pods/permission/permission.module';
import { AccessControlLayerModuleServiceModule } from './pods/access-control-layer-module-service/access-control-layer-module-service.module';
import { YieldConfigModule } from './pods/yield-config/yieldconfig.module';
import { IntegratorsModule } from './pods/integrators/integrators.module';
import { AdminModule } from './pods/admin/admin.module';
import { EmailConfirmationModule } from './pods/email-confirmation/email-confirmation.module';
import { InvitationModule } from './pods/invitation/invitation.module';
import { IssuerModule } from './pods/issuer/issuer.module';
import { ReadsModule } from './pods/reads/reads.module';
import { FileModule } from './pods/file';
import { DeviceGroupModule } from './pods/device-group/device-group.module';
import { DeviceModule } from './pods/device';
import { UserModule } from './pods/user/user.module';
import { OrganizationModule } from './pods/organization/organization.module';
import { MailModule } from './mail';
import { AuthModule } from './auth/auth.module';
import { OnChainCertificateModule } from '@energyweb/origin-247-certificate';
import { BlockchainPropertiesModule } from '@energyweb/issuer-api';
import { getConnection } from 'typeorm';

describe('DrecModule', () => {
  let module: TestingModule;

  afterEach(async () => {
    const connection = getConnection();
    if (connection.isConnected) {
      await connection.close();
    }
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DrecModule],
    }).compile();
  }); 

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ConfigService', () => {
    const configService = module.get<ConfigService>(ConfigService);
    expect(configService).toBeDefined();
  });

  it('should provide User repository', () => {
    const userRepository = module.get<Repository<User>>(
      getRepositoryToken(User),
    );
    expect(userRepository).toBeDefined();
  });

  it('should provide Device repository', () => {
    const deviceRepository = module.get<Repository<Device>>(
      getRepositoryToken(Device),
    );
    expect(deviceRepository).toBeDefined();
  });

  it('should provide Organization repository', () => {
    const organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    expect(organizationRepository).toBeDefined();
  });

  it('should provide UserRole repository', () => {
    const userRoleRepository = module.get<Repository<UserRole>>(
      getRepositoryToken(UserRole),
    );
    expect(userRoleRepository).toBeDefined();
  });

  it('should provide Invitation repository', () => {
    const invitationRepository = module.get<Repository<Invitation>>(
      getRepositoryToken(Invitation),
    );
    expect(invitationRepository).toBeDefined();
  });

  it('should provide EmailConfirmation repository', () => {
    const emailConfirmationRepository = module.get<
      Repository<EmailConfirmation>
    >(getRepositoryToken(EmailConfirmation));
    expect(emailConfirmationRepository).toBeDefined();
  });

  it('should provide YieldConfig repository', () => {
    const yieldConfigRepository = module.get<Repository<YieldConfig>>(
      getRepositoryToken(YieldConfig),
    );
    expect(yieldConfigRepository).toBeDefined();
  });

  it('should provide AClModules repository', () => {
    const aclModulesRepository = module.get<Repository<AClModules>>(
      getRepositoryToken(AClModules),
    );
    expect(aclModulesRepository).toBeDefined();
  });

  it('should provide ACLModulePermissions repository', () => {
    const aclModulePermissionsRepository = module.get<
      Repository<ACLModulePermissions>
    >(getRepositoryToken(ACLModulePermissions));
    expect(aclModulePermissionsRepository).toBeDefined();
  });

  it('should provide DeviceCsvFileProcessingJobsEntity repository', () => {
    const deviceCsvFileProcessingJobsRepository = module.get<
      Repository<DeviceCsvFileProcessingJobsEntity>
    >(getRepositoryToken(DeviceCsvFileProcessingJobsEntity));
    expect(deviceCsvFileProcessingJobsRepository).toBeDefined();
  });

  it('should provide DeviceCsvProcessingFailedRowsEntity repository', () => {
    const deviceCsvProcessingFailedRowsRepository = module.get<
      Repository<DeviceCsvProcessingFailedRowsEntity>
    >(getRepositoryToken(DeviceCsvProcessingFailedRowsEntity));
    expect(deviceCsvProcessingFailedRowsRepository).toBeDefined();
  });

  it('should provide DeviceGroupNextIssueCertificate repository', () => {
    const deviceGroupNextIssueCertificateRepository = module.get<
      Repository<DeviceGroupNextIssueCertificate>
    >(getRepositoryToken(DeviceGroupNextIssueCertificate));
    expect(deviceGroupNextIssueCertificateRepository).toBeDefined();
  });

  it('should provide AggregateMeterRead repository', () => {
    const aggregateMeterReadRepository = module.get<
      Repository<AggregateMeterRead>
    >(getRepositoryToken(AggregateMeterRead));
    expect(aggregateMeterReadRepository).toBeDefined();
  });

  it('should provide HistoryIntermediate_MeterRead repository', () => {
    const historyIntermediateMeterReadRepository = module.get<
      Repository<HistoryIntermediate_MeterRead>
    >(getRepositoryToken(HistoryIntermediate_MeterRead));
    expect(historyIntermediateMeterReadRepository).toBeDefined();
  });

  it('should provide CheckCertificateIssueDateLogForDeviceEntity repository', () => {
    const checkCertificateIssueDateLogForDeviceRepository = module.get<
      Repository<CheckCertificateIssueDateLogForDeviceEntity>
    >(getRepositoryToken(CheckCertificateIssueDateLogForDeviceEntity));
    expect(checkCertificateIssueDateLogForDeviceRepository).toBeDefined();
  });

  it('should provide CheckCertificateIssueDateLogForDeviceGroupEntity repository', () => {
    const checkCertificateIssueDateLogForDeviceGroupRepository = module.get<
      Repository<CheckCertificateIssueDateLogForDeviceGroupEntity>
    >(getRepositoryToken(CheckCertificateIssueDateLogForDeviceGroupEntity));
    expect(checkCertificateIssueDateLogForDeviceGroupRepository).toBeDefined();
  });

  it('should provide SdgBenefit repository', () => {
    const sdgBenefitRepository = module.get<Repository<SdgBenefit>>(
      getRepositoryToken(SdgBenefit),
    );
    expect(sdgBenefitRepository).toBeDefined();
  });

  it('should provide DeltaFirstRead repository', () => {
    const deltaFirstReadRepository = module.get<Repository<DeltaFirstRead>>(
      getRepositoryToken(DeltaFirstRead),
    );
    expect(deltaFirstReadRepository).toBeDefined();
  });

  it('should provide IrecDevicesInformationEntity repository', () => {
    const irecDevicesInformationRepository = module.get<
      Repository<IrecDevicesInformationEntity>
    >(getRepositoryToken(IrecDevicesInformationEntity));
    expect(irecDevicesInformationRepository).toBeDefined();
  });

  it('should provide IrecErrorLogInformationEntity repository', () => {
    const irecErrorLogInformationRepository = module.get<
      Repository<IrecErrorLogInformationEntity>
    >(getRepositoryToken(IrecErrorLogInformationEntity));
    expect(irecErrorLogInformationRepository).toBeDefined();
  });

  it('should provide UserLoginSessionEntity repository', () => {
    const userLoginSessionRepository = module.get<
      Repository<UserLoginSessionEntity>
    >(getRepositoryToken(UserLoginSessionEntity));
    expect(userLoginSessionRepository).toBeDefined();
  });

  it('should provide DeviceLateongoingIssueCertificateEntity repository', () => {
    const deviceLateongoingIssueCertificateRepository = module.get<
      Repository<DeviceLateongoingIssueCertificateEntity>
    >(getRepositoryToken(DeviceLateongoingIssueCertificateEntity));
    expect(deviceLateongoingIssueCertificateRepository).toBeDefined();
  });

  it('should import HttpModule', () => {
    const httpModule = module.get<HttpModule>(HttpModule);
    expect(httpModule).toBeDefined();
  });

  // Test the existence of other modules
  it('should import AuthModule', () => {
    const authModule = module.get(AuthModule);
    expect(authModule).toBeDefined();
  });

  it('should import MailModule', () => {
    const mailModule = module.get(MailModule);
    expect(mailModule).toBeDefined();
  });

  it('should import OrganizationModule', () => {
    const organizationModule = module.get(OrganizationModule);
    expect(organizationModule).toBeDefined();
  });

  it('should import UserModule', () => {
    const userModule = module.get(UserModule);
    expect(userModule).toBeDefined();
  });

  it('should import DeviceModule', () => {
    const deviceModule = module.get(DeviceModule);
    expect(deviceModule).toBeDefined();
  });

  it('should import DeviceGroupModule', () => {
    const deviceGroupModule = module.get(DeviceGroupModule);
    expect(deviceGroupModule).toBeDefined();
  });

  it('should import FileModule', () => {
    const fileModule = module.get(FileModule);
    expect(fileModule).toBeDefined();
  });

  it('should import ReadsModule', () => {
    const readsModule = module.get(ReadsModule);
    expect(readsModule).toBeDefined();
  });

  it('should import IssuerModule', () => {
    const issuerModule = module.get(IssuerModule);
    expect(issuerModule).toBeDefined();
  });

  it('should import InvitationModule', () => {
    const invitationModule = module.get(InvitationModule);
    expect(invitationModule).toBeDefined();
  });

  it('should import EmailConfirmationModule', () => {
    const emailConfirmationModule = module.get(EmailConfirmationModule);
    expect(emailConfirmationModule).toBeDefined();
  });

  it('should import AdminModule', () => {
    const adminModule = module.get(AdminModule);
    expect(adminModule).toBeDefined();
  });

  it('should import IntegratorsModule', () => {
    const integratorsModule = module.get(IntegratorsModule);
    expect(integratorsModule).toBeDefined();
  });

  it('should import YieldConfigModule', () => {
    const yieldConfigModule = module.get(YieldConfigModule);
    expect(yieldConfigModule).toBeDefined();
  });

  it('should import AccessControlLayerModuleServiceModule', () => {
    const accessControlLayerModuleServiceModule = module.get(
      AccessControlLayerModuleServiceModule,
    );
    expect(accessControlLayerModuleServiceModule).toBeDefined();
  });

  it('should import PermissionModule', () => {
    const permissionModule = module.get(PermissionModule);
    expect(permissionModule).toBeDefined();
  });

  it('should import CountrycodeModule', () => {
    const countrycodeModule = module.get(CountrycodeModule);
    expect(countrycodeModule).toBeDefined();
  });

  it('should import SdgbenefitModule', () => {
    const sdgbenefitModule = module.get(SdgbenefitModule);
    expect(sdgbenefitModule).toBeDefined();
  });

  it('should import CertificateLogModule', () => {
    const certificateLogModule = module.get(CertificateLogModule);
    expect(certificateLogModule).toBeDefined();
  });

  it('should import OnChainCertificateModule', () => {
    const onChainCertificateModule = module.get(OnChainCertificateModule);
    expect(onChainCertificateModule).toBeDefined();
  });

  it('should import BlockchainPropertiesModule', () => {
    const blockchainPropertiesModule = module.get(BlockchainPropertiesModule);
    expect(blockchainPropertiesModule).toBeDefined();
  });
});
