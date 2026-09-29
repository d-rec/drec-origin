import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { Queues } from '../../../utils/enums/queues.enum';
import { HistoryNextIssuanceStatus } from '../../../utils/enums/history_next_issuance.enum';
import { CertificateLogService } from '../../certificate-log/certificate-log.service';
import { DeviceService } from '../../device/device.service';
import { DeviceGroupService } from '../../device-group/device-group.service';
import { HistoryDeviceGroupNextIssueCertificate } from '../../device-group/history_next_issuance_date_log.entity';
import { OrganizationService } from '../../organization/organization.service';
import { MeterRead } from '../../reads/reads.entity';
import { ReadsService } from '../../reads/reads.service';
import { CertificateService } from './certificate.service';
import { HistoricalIssuanceService } from './historical-issuance.service';

/**
 * A historical catch-up uploads reads while issuance is already running, so
 * reads can land after a pass has enumerated them. Marking the request
 * Completed regardless strands them permanently — scheduleIssuance only ever
 * picks up Pending requests. This stranded 10 months of a live site.
 */
describe('HistoricalIssuanceService — closing a request', () => {
  let service: HistoricalIssuanceService;
  let groupService: DeviceGroupService;
  let readsService: ReadsService;

  const request = {
    id: 2164,
    device_externalid: 'device-ext-id',
    groupId: 234,
    reservationStartDate: new Date('2024-12-31T18:30:00Z'),
    reservationEndDate: new Date('2026-09-04T06:21:25Z'),
  } as unknown as HistoryDeviceGroupNextIssueCertificate;

  const read = (id: number): MeterRead =>
    ({ id, value: 2_000_000, certified: false }) as unknown as MeterRead;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricalIssuanceService,
        {
          provide: getQueueToken(Queues.HistoricalIssuance),
          useValue: { add: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: DeviceGroupService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: 234,
              organizationId: 1,
              reservationEndDate: new Date('2030-12-31T18:29:59Z'),
            }),
            updateHistoryCertificateIssueStatus: jest.fn(),
            updateTotalReadingRequestedForCertificateIssuance: jest.fn(),
            countGroupIdHistoryIssuanceDeviceLog: jest
              .fn()
              .mockResolvedValue(1),
            getGroupCertificateIssueDate: jest.fn().mockResolvedValue(null),
            deactivateReservation: jest.fn(),
          } as any,
        },
        {
          provide: DeviceService,
          useValue: {
            findReads: jest.fn().mockResolvedValue({
              id: 2488,
              createdAt: new Date('2026-09-04T06:21:25Z'),
            }),
            removeFromGroup: jest.fn(),
          } as any,
        },
        {
          provide: OrganizationService,
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue({
                name: 'org',
                blockchainAccountAddress: '0x',
              }),
          } as any,
        },
        {
          provide: ReadsService,
          useValue: {
            getCheckHistoryCertificateIssueDateLogForDevice: jest.fn(),
          } as any,
        },
        {
          provide: CertificateService,
          useValue: { issue: jest.fn() } as any,
        },
        {
          provide: CertificateLogService,
          useValue: { createForDevice: jest.fn() } as any,
        },
      ],
    }).compile();

    service = module.get(HistoricalIssuanceService);
    groupService = module.get(DeviceGroupService);
    readsService = module.get(ReadsService);

    // issueCertificate does the on-chain work; the closing decision is what
    // these tests are about.
    jest.spyOn(service as any, 'issueCertificate').mockResolvedValue(undefined);
  });

  const setReads = (first: MeterRead[], second: MeterRead[]) =>
    (readsService.getCheckHistoryCertificateIssueDateLogForDevice as jest.Mock)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

  it('leaves the request Pending when reads arrive after enumeration', async () => {
    // 3 reads issued, then 10 more land mid-upload.
    setReads([read(1), read(2), read(3)], [read(4), read(5)]);

    await service.processIssuanceRequest(request, 0);

    expect(
      groupService.updateHistoryCertificateIssueStatus,
    ).not.toHaveBeenCalled();
  });

  it('completes the request once the window is drained', async () => {
    setReads([read(1), read(2)], []);

    await service.processIssuanceRequest(request, 0);

    expect(
      groupService.updateHistoryCertificateIssueStatus,
    ).toHaveBeenCalledWith(request.id, HistoryNextIssuanceStatus.Completed);
  });

  it('completes rather than retrying reads it already attempted', async () => {
    // Same reads still uncertified after the attempt — issuing them failed for
    // a real reason. Re-pending here would spin the cron every five minutes.
    setReads([read(1), read(2)], [read(1), read(2)]);

    await service.processIssuanceRequest(request, 0);

    expect(
      groupService.updateHistoryCertificateIssueStatus,
    ).toHaveBeenCalledWith(request.id, HistoryNextIssuanceStatus.Completed);
  });
});
