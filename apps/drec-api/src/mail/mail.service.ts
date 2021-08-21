import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async send(sendMailOptions: ISendMailOptions): Promise<boolean> {
    try {
      const result = await this.mailerService.sendMail({
        replyTo: this.configService.get<string>('EMAIL_REPLY_TO'),
        ...sendMailOptions,
      });

      this.logger.log(`Sending email...`);
      this.logger.error(JSON.stringify(result));

      const allSucceeded = result?.response.every((m: { status: string }) =>
        ['sent', 'queued', 'scheduled'].includes(m.status),
      );

      if (allSucceeded) {
        this.logger.log(`Sent email with id: ${result.messageId}.`);
        this.logger.log(JSON.stringify(result.response));
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error when sending email.`);
      this.logger.error(JSON.stringify(error));
    }

    return false;
  }
}
