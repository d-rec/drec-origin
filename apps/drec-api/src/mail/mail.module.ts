import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          transport: {
            host: configService.get<string>('SMTP_HOST'),
            port: configService.get<number>('SMTP_PORT'),
            secure: true,
            auth: {
              user: configService.get<string>('SMTP_LOGIN') ?? '',
              pass: configService.get<string>('SMTP_PASSWORD') ?? '',
            },
          },
          defaults: {
            from: `"${configService.get<string>(
              'EMAIL_FROM_NAME',
            )}" <${configService.get<string>('EMAIL_FROM')}>`,
          },
          template: {
            dir: `${__dirname}/templates`,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
