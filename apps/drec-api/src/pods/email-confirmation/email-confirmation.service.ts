import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { MailService } from '../../mail';
import {
  EmailConfirmationResponse,
  IEmailConfirmationToken,
  ISuccessResponse,
  IUser,
} from '../../models';

import { User } from '../user/user.entity';
import { EmailConfirmation } from './email-confirmation.entity';

@Injectable()
export class EmailConfirmationService {
  private readonly logger = new Logger(EmailConfirmationService.name);

  constructor(
    @InjectRepository(EmailConfirmation)
    private readonly repository: Repository<EmailConfirmation>,
    private mailService: MailService,
  ) {}

  public async create(user: User): Promise<EmailConfirmation> {
    const exists = await this.repository.findOne({
      user: { email: user.email },
    });

    if (exists) {
      throw new ConflictException({
        success: false,
        message: `Email confirmation for user with email ${user.email} already exists`,
      });
    }

    const { token, expiryTimestamp } = this.generateEmailToken();

    const emailConfirmation = await this.repository.save({
      user,
      confirmed: false,
      token,
      expiryTimestamp,
    });

    await this.sendConfirmationEmail(user.email);

    return emailConfirmation;
  }

  async get(userId: IUser['id']): Promise<EmailConfirmation | undefined> {
    const all = await this.repository.find({ relations: ['user'] });

    return all.find((confirmation) => confirmation.user.id === userId);
  }

  async getByEmail(
    email: IUser['email'],
  ): Promise<EmailConfirmation | undefined> {
    const all = await this.repository.find({ relations: ['user'] });

    return all.find(
      (confirmation) =>
        confirmation.user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async confirmEmail(
    token: IEmailConfirmationToken['token'],
  ): Promise<EmailConfirmationResponse> {
    const emailConfirmation = await this.repository.findOne({ token });
    console.log('EMAIL confirmation: ', emailConfirmation);

    if (!emailConfirmation) {
      throw new BadRequestException({
        success: false,
        message: `Email confirmation doesn't exist`,
      });
    }

    if (emailConfirmation.confirmed === true) {
      return EmailConfirmationResponse.AlreadyConfirmed;
    }

    if (
      emailConfirmation.expiryTimestamp < Math.floor(DateTime.now().toSeconds())
    ) {
      return EmailConfirmationResponse.Expired;
    }

    await this.repository.update(emailConfirmation.id, {
      confirmed: true,
    });

    return EmailConfirmationResponse.Success;
  }

  public async sendConfirmationEmail(
    email: IUser['email'],
  ): Promise<ISuccessResponse> {
    const currentToken = await this.getByEmail(email);

    if (!currentToken) {
      return {
        message: 'Token not found',
        success: false,
      };
    }

    let { token, expiryTimestamp } = currentToken;
    const { id, confirmed } = currentToken;

    if (confirmed === true) {
      throw new BadRequestException({
        success: false,
        message: `Email already confirmed`,
      });
    }

    if (expiryTimestamp < Math.floor(DateTime.now().toSeconds())) {
      const newToken = this.generateEmailToken();
      await this.repository.update(id, newToken);

      ({ token, expiryTimestamp } = newToken);
    }

    await this.sendConfirmEmailRequest(email.toLowerCase(), token);

    return {
      success: true,
    };
  }

  private async sendConfirmEmailRequest(
    email: string,
    token: string,
  ): Promise<void> {
    const url = `${process.env.REACT_APP_BACKEND_URL}/account/confirm-email?token=${token}`;

    const result = await this.mailService.send({
      to: email,
      subject: `[Origin] Confirm your email address`,
      html: `Welcome to the marketplace! Please click the link below to verify your email address: <br/> <br/> <a href="${url}">${url}</a>.`,
    });

    if (result) {
      this.logger.log(`Notification email sent to ${email}.`);
    }
  }

  generateEmailToken(): IEmailConfirmationToken {
    return {
      token: crypto.randomBytes(64).toString('hex'),
      expiryTimestamp: Math.floor(
        DateTime.now().plus({ hours: 8 }).toSeconds(),
      ),
    };
  }
}
