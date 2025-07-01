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

      const allSucceeded =
        result?.accepted?.length > 0 &&
        (!result?.rejected || result.rejected.length === 0) &&
        /queued|ok|250/i.test(result.response);

      if (allSucceeded) {
        this.logger.log(`Sent email with id: ${result.messageId}.`);
        this.logger.log(JSON.stringify(result));
        return true;
      }
    } catch (error) {
      this.logger.error(`Error when sending email.`);
      this.logger.error(error);
    }

    return false;
  }
}
