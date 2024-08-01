/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { Logger } from '@nestjs/common';

describe('MailService', () => {
  let logger = new Logger(MailService.name);
  let service: MailService;
  let mailerService: MailerService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          } as any,
        },
        {
          provide: ConfigService,
          useValue: {} as any,
        },
        Logger,
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
      it('should return false when email sending fails', async () => {
        jest.spyOn(mailerService, 'sendMail').mockResolvedValue({
          response: [{ status: 'failed' }],
          messageId: '123',
        });
    
        const result = await service.send({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test',
        });
    
        expect(result).toBe(false);
      });
    
      it('should return false when an exception is thrown', async () => {
        jest.spyOn(mailerService, 'sendMail').mockRejectedValue(new Error('Test Error'));
    
        const result = await service.send({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test',
        });
    
        expect(result).toBe(false);
      });
    
      it('should log errors appropriately', async () => {
        const loggerSpy = jest.spyOn(Logger.prototype, 'error');
        jest.spyOn(mailerService, 'sendMail').mockRejectedValue(new Error('Test Error'));
    
        await service.send({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test',
        });
    
        expect(loggerSpy).toHaveBeenCalledWith('Error when sending email.');
        expect(loggerSpy).toHaveBeenCalledWith(JSON.stringify(new Error('Test Error')));
      });
  });
});
