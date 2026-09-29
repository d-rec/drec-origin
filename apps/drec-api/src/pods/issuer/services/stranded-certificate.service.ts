import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterRead } from '../../reads/reads.entity';
import { NonConcurrentCron } from '../../../lib/cron';
import { MailService } from '../../../mail/mail.service';

/**
 * A certificate normally reaches the chain within ~2 minutes of being issued.
 * When it does not, the platform gives up quietly: the issuance job retries a
 * bounded number of times (recording PersistError events) and then stops, and
 * nothing afterwards reopens it. The meter reads stay marked certified, so no
 * later pass reconsiders them either — the buyer simply never gets a token.
 *
 * Three certificates sat in that state for six weeks (SELF Uganda, Aug 2026)
 * and were only found by chance. Nothing detects it, which is what this fixes.
 */
@Injectable()
export class StrandedCertificateService {
  private readonly logger = new Logger(StrandedCertificateService.name);

  /**
   * How long a certificate may stay unsynced before it counts as stranded.
   * Healthy ones sync in under two minutes and the retry sequence is finished
   * within about eight, so half an hour is well clear of a slow-but-fine mint.
   */
  private static readonly STRANDED_AFTER_MINUTES = 30;

  /** Re-send an unchanged alert at most this often, so it cannot be ignored. */
  private static readonly REALERT_AFTER_HOURS = 24;

  /**
   * Best-effort de-duplication so an ongoing incident does not mail every run.
   * Held in memory: a pod restart, or the cron lock moving to the other
   * replica, can repeat an alert. That is the right way round to fail — a
   * duplicate email is cheap, and silence is the bug this exists to prevent.
   */
  private lastAlertSignature = '';
  private lastAlertAt = 0;

  constructor(
    /**
     * Only used as a handle for raw SQL: certificate_read_model belongs to
     * @energyweb/origin-247-certificate and has no entity here. Repository
     * .query() is deliberate — DataSource/InjectDataSource do not exist in
     * the TypeORM 0.2 line that the prod branch still builds against, and
     * this service is cherry-picked there.
     */
    @InjectRepository(MeterRead)
    private readonly reads: Repository<MeterRead>,
    private readonly mailService: MailService,
  ) {}

  @NonConcurrentCron(CronExpression.EVERY_30_MINUTES)
  async checkForStrandedCertificates(): Promise<void> {
    this.logger.debug('CRON [*/30m]: stranded certificate check');
    await this.detectAndAlert();
  }

  /**
   * The check itself, separated from the cron decorator so it can be driven
   * directly — the decorator takes a Redis lock, which a unit test has no way
   * to satisfy.
   */
  async detectAndAlert(): Promise<void> {
    let rows: StrandedRow[];
    try {
      rows = await this.findStranded();
    } catch (err: any) {
      this.logger.warn(`stranded certificate check failed: ${err?.message}`);
      return;
    }

    if (rows.length === 0) {
      this.lastAlertSignature = '';
      return;
    }

    this.logger.error(
      `${rows.length} certificate(s) issued but never confirmed on-chain: ` +
        rows
          .map((r) => `#${r.internalCertificateId} (group ${r.groupId})`)
          .join(', ') +
        '. These will not retry on their own and the underlying reads are ' +
        'still marked certified, so nothing will pick them up.',
    );

    if (this.shouldSendEmail(rows)) {
      await this.sendAlert(rows);
    }
  }

  private async findStranded(): Promise<StrandedRow[]> {
    return this.reads.query(
      `SELECT c."internalCertificateId"       AS "internalCertificateId",
              c."deviceId"                    AS "groupId",
              c."createdAt"                   AS "createdAt",
              to_timestamp(c."generationStartTime") AS "generationStart",
              to_timestamp(c."generationEndTime")   AS "generationEnd",
              round(extract(epoch FROM now() - c."createdAt") / 3600)::int
                                              AS "strandedHours",
              (SELECT count(*)::int FROM certificate_event e
                WHERE e."internalCertificateId" = c."internalCertificateId"
                  AND e.type = 'PersistError')  AS "persistErrors"
         FROM certificate_read_model c
        WHERE c."isSynced" = false
          AND c."createdAt" < now() - make_interval(mins => $1)
        ORDER BY c."createdAt"`,
      [StrandedCertificateService.STRANDED_AFTER_MINUTES],
    );
  }

  private shouldSendEmail(rows: StrandedRow[]): boolean {
    const signature = rows
      .map((r) => r.internalCertificateId)
      .sort()
      .join(',');
    const staleHours = (Date.now() - this.lastAlertAt) / (1000 * 60 * 60);

    if (
      signature === this.lastAlertSignature &&
      staleHours < StrandedCertificateService.REALERT_AFTER_HOURS
    ) {
      return false;
    }

    this.lastAlertSignature = signature;
    this.lastAlertAt = Date.now();
    return true;
  }

  private async sendAlert(rows: StrandedRow[]): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      this.logger.warn(
        'ADMIN_EMAIL not set — stranded certificates logged but not emailed',
      );
      return;
    }

    const list = rows
      .map(
        (r) =>
          `<tr><td>${r.internalCertificateId}</td><td>${r.groupId}</td>` +
          `<td>${fmt(r.generationStart)} &rarr; ${fmt(r.generationEnd)}</td>` +
          `<td>${r.strandedHours}h</td><td>${r.persistErrors}</td></tr>`,
      )
      .join('');

    const sent = await this.mailService.send({
      to: adminEmail,
      subject: `[D-REC] ${rows.length} certificate(s) issued but not on-chain`,
      html:
        `<p>${rows.length} certificate(s) were issued but never confirmed ` +
        `on-chain. They will not retry on their own, and the meter reads ` +
        `behind them are still marked certified, so no later issuance pass ` +
        `will reconsider them. The buyer has no usable token until someone ` +
        `intervenes.</p>` +
        `<table border="1" cellpadding="6" cellspacing="0">` +
        `<tr><th>Certificate</th><th>Group</th><th>Period</th>` +
        `<th>Stranded</th><th>Persist errors</th></tr>${list}</table>` +
        `<p>Persist errors are shown for context only — they are common and ` +
        `certificates routinely recover after several, so the count does not ` +
        `by itself mean anything is wrong. What matters is that these have ` +
        `stayed unconfirmed well past the point where a healthy mint settles. ` +
        `<code>certificate_event</code> holds the full history for each one, ` +
        `and survives any cleanup of the certificate row itself.</p>`,
    });

    if (sent) {
      this.logger.log(
        `Stranded certificate alert sent to admin (${adminEmail}).`,
      );
    }
  }
}

function fmt(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}

interface StrandedRow {
  internalCertificateId: number;
  groupId: string;
  createdAt: Date;
  generationStart: Date;
  generationEnd: Date;
  strandedHours: number;
  persistErrors: number;
}
