import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MailService } from '../../../mail/mail.service';
import { StrandedCertificateService } from './stranded-certificate.service';

describe('StrandedCertificateService', () => {
  let service: StrandedCertificateService;
  let dataSource: DataSource;
  let mailService: MailService;

  const row = (id: number) => ({
    internalCertificateId: id,
    groupId: '228',
    createdAt: new Date('2026-08-18T16:50:05Z'),
    generationStart: new Date('2024-03-31T21:00:00Z'),
    generationEnd: new Date('2024-04-30T20:59:59Z'),
    strandedHours: 1000,
    persistErrors: 8,
  });

  beforeEach(async () => {
    process.env.ADMIN_EMAIL = 'admin@drecs.org';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrandedCertificateService,
        {
          provide: getDataSourceToken(),
          useValue: { query: jest.fn() } as any,
        },
        {
          provide: MailService,
          useValue: { send: jest.fn().mockResolvedValue(true) } as any,
        },
      ],
    }).compile();

    service = module.get(StrandedCertificateService);
    dataSource = module.get(getDataSourceToken());
    mailService = module.get(MailService);
  });

  const returns = (...batches: any[][]) => {
    const q = dataSource.query as jest.Mock;
    batches.forEach((b) => q.mockResolvedValueOnce(b));
  };

  it('stays silent when nothing is stranded', async () => {
    returns([]);
    await service.detectAndAlert();
    expect(mailService.send).not.toHaveBeenCalled();
  });

  it('emails when a certificate is stranded', async () => {
    returns([row(246822)]);
    await service.detectAndAlert();

    expect(mailService.send).toHaveBeenCalledTimes(1);
    const sent = (mailService.send as jest.Mock).mock.calls[0][0];
    expect(sent.to).toBe('admin@drecs.org');
    expect(sent.subject).toContain('1 certificate(s)');
    expect(sent.html).toContain('246822');
  });

  it('does not re-email an unchanged set', async () => {
    returns([row(246822)], [row(246822)]);
    await service.detectAndAlert();
    await service.detectAndAlert();
    expect(mailService.send).toHaveBeenCalledTimes(1);
  });

  it('emails again when a new certificate strands', async () => {
    returns([row(246822)], [row(246822), row(246823)]);
    await service.detectAndAlert();
    await service.detectAndAlert();
    expect(mailService.send).toHaveBeenCalledTimes(2);
  });

  it('re-emails a recurrence after the set has cleared', async () => {
    returns([row(246822)], [], [row(246822)]);
    await service.detectAndAlert();
    await service.detectAndAlert(); // resolved
    await service.detectAndAlert(); // strands again
    expect(mailService.send).toHaveBeenCalledTimes(2);
  });

  it('logs but does not throw when ADMIN_EMAIL is unset', async () => {
    delete process.env.ADMIN_EMAIL;
    returns([row(246822)]);
    await expect(service.detectAndAlert()).resolves.not.toThrow();
    expect(mailService.send).not.toHaveBeenCalled();
  });

  it('survives a database error without throwing', async () => {
    (dataSource.query as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(service.detectAndAlert()).resolves.not.toThrow();
    expect(mailService.send).not.toHaveBeenCalled();
  });
});
