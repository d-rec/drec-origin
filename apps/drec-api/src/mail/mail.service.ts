import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';
import { render } from '@react-email/components';
import React from 'react';

type SendMailOptions = Omit<ISendMailOptions, 'template'> & {
  template?: React.ReactNode;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  public async send(options: SendMailOptions): Promise<boolean> {
    let htmlContent = options.html;

    if (options.template) {
      htmlContent = await render(options.template);
    }
    return this.execute({
      ...options,
      template: undefined,
      html: htmlContent,
    });
  }

  private async execute(sendMailOptions: ISendMailOptions): Promise<boolean> {
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
