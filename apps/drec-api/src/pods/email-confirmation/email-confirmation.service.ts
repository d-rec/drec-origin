import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import { Repository, FindOptionsWhere } from 'typeorm';
import { MailService } from '../../mail';
import { IEmailConfirmationToken, ISuccessResponse, IUser } from '../../models';
import { EmailConfirmationResponse, Role } from '../../utils/enums';
import { OrganizationDTO } from '../organization/dto';
import { User } from '../user/user.entity';
import { EmailConfirmation } from './email-confirmation.entity';
import { OauthClientCredentialsService } from '../user/oauth_client.service';
import { UserService } from '../user/user.service';
export interface SuccessResponse {
  success: boolean;
  message: string;
}
@Injectable()
export class EmailConfirmationService {
  private readonly logger = new Logger(EmailConfirmationService.name);

  constructor(
    @InjectRepository(EmailConfirmation)
    private readonly repository: Repository<EmailConfirmation>,
    private mailService: MailService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly oauthClientCredentialsService: OauthClientCredentialsService,
  ) {}

  public async create(user: User): Promise<EmailConfirmation | null> {
    this.logger.verbose(`With in create`);
    if (
      (await this.userService.findOne({
        role: Role.Admin,
        api_user_id: user.api_user_id,
      })) != undefined ||
      user.role === 'ApiUser'
    ) {
      const exists = await this.repository.findOne({
        where: {
          user: { email: user.email },
        },
        relations: ['user'],
      });

      if (exists) {
        this.logger.error(
          `Email confirmation for user with email ${user.email} already exists`,
        );
        throw new ConflictException({
          success: false,
          message: `Email confirmation for user with email ${user.email} already exists`,
        });
      }
      const { token, expiryTimestamp } = await this.generateEmailToken();
      const emailConfirmation = await this.repository.save({
        user,
        confirmed: false,
        token,
        expiryTimestamp,
      });
      // if (inviteuser) {
      //   //  await this.sendResetPasswordRequest(user.email, token);
      //   await this.sendInvitation(orgname, user.email, token);
      // } else {
      await this.sendConfirmationEmail(user.email);
      // }
      return emailConfirmation;
    }
    return null;
  }

  // create function when orguseradmin direct added by super admin so confirm email true
  public async admincreate(
    user: User,
    password: string,
  ): Promise<EmailConfirmation> {
    this.logger.verbose(`With in admincreate`);
    const exists = await this.repository.findOne({
      where: {
        user: { email: user.email },
      },
      relations: ['user'],
    });

    if (exists) {
      this.logger.error(
        `Email confirmation for user with email ${user.email} already exists`,
      );
      throw new ConflictException({
        success: false,
        message: `Email confirmation for user with email ${user.email} already exists`,
      });
    }

    const { token, expiryTimestamp } = await this.generateEmailToken();

    const emailConfirmation = await this.repository.save({
      user,
      confirmed: true,
      token,
      expiryTimestamp,
    });

    await this.sendadminConfirmEmailRequest(user.email, password);

    return emailConfirmation;
  }

  async get(userId: IUser['id']): Promise<EmailConfirmation | undefined> {
    this.logger.verbose(`With in get`);
    const all = await this.repository.find({ relations: ['user'] });

    return all.find((confirmation) => confirmation.user.id === userId);
  }

  async getByEmail(
    email: IUser['email'],
  ): Promise<EmailConfirmation | undefined> {
    this.logger.verbose(`With in getByEmail`);
    const all = await this.repository.find({ relations: ['user'] });

    return all.find(
      (confirmation) =>
        confirmation.user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  async findOne(
    conditions: FindOptionsWhere<EmailConfirmation>,
  ): Promise<EmailConfirmation | undefined> {
    this.logger.verbose(`With in findOne`);
    const user = await (this.repository.findOne({
      where: conditions as FindOptionsWhere<EmailConfirmation>,
      relations: ['user'],
    }) as Promise<EmailConfirmation> as Promise<EmailConfirmation | undefined>);

    return user;
  }
  async confirmEmail(
    token: IEmailConfirmationToken['token'],
  ): Promise<SuccessResponse> {
    this.logger.verbose(`With in confirmEmail`);
    const emailConfirmation = await this.repository.findOne({
      where: {
        token,
      },
    });

    if (!emailConfirmation) {
      this.logger.error(`Email confirmation doesn't exist`);
      throw new BadRequestException({
        success: false,
        message: `Email confirmation doesn't exist`,
      });
    }

    if (emailConfirmation.confirmed === true) {
      this.logger.warn('EmailConfirmationResponse.AlreadyConfirmed');
      return {
        success: false,
        message: EmailConfirmationResponse.AlreadyConfirmed,
      };
    }

    if (
      emailConfirmation.expiryTimestamp < Math.floor(DateTime.now().toSeconds())
    ) {
      this.logger.warn(`EmailConfirmationResponse.Expired`);
      return {
        success: false,
        message: EmailConfirmationResponse.Expired,
      };
    }

    await this.repository.update(emailConfirmation.id, {
      confirmed: true,
    });

    this.logger.warn(EmailConfirmationResponse.Success);
    return {
      success: true,
      message: EmailConfirmationResponse.Success,
    };
  }

  public async sendConfirmationEmail(
    email: IUser['email'],
  ): Promise<ISuccessResponse> {
    this.logger.verbose(`With in sendConfirmationEmail`);
    const currentToken = await this.getByEmail(email);

    if (!currentToken) {
      this.logger.error(`Token not found`);
      return {
        message: 'Token not found',
        success: false,
      };
    }

    const { id, confirmed } = currentToken;
    if (confirmed === true) {
      this.logger.error(`Email already confirmed`);
      throw new BadRequestException({
        success: false,
        message: `Email already confirmed`,
      });
    }
    const { token, expiryTimestamp } = await this.generatetoken(
      currentToken,
      id,
    );

    await this.sendConfirmEmailRequest(email.toLowerCase(), token);

    return {
      success: true,
    };
  }

  public async ConfirmationEmailForResetPassword(
    email: IUser['email'],
  ): Promise<ISuccessResponse> {
    this.logger.verbose(`With in ConfirmationEmailForResetPassword`);
    const currentToken = await this.getByEmail(email);
    if (!currentToken) {
      this.logger.error(`Email not found or Email not registered`);
      return {
        message: 'Email not found or Email not registered',
        success: false,
      };
    }
    const { id, confirmed } = currentToken;
    const { token, expiryTimestamp } = await this.generatetoken(
      currentToken,
      id,
    );

    await this.sendResetPasswordRequest(
      email.toLowerCase(),
      token,
      currentToken.user.role,
    );

    this.logger.log(
      `Password Reset Mail has been sent to your register authorized Email.`,
    );
    return {
      success: true,
      message:
        'Password Reset Mail has been sent to your register authorized Email.',
    };
  }
  public async generatetoken(currentToken, id) {
    this.logger.verbose(`With in generatetoken`);
    let { token, expiryTimestamp } = currentToken;

    if (expiryTimestamp < Math.floor(DateTime.now().toSeconds())) {
      const newToken = this.generateEmailToken();
      await this.repository.update(id, newToken);

      return ({ token, expiryTimestamp } = newToken);
    } else {
      return ({ token, expiryTimestamp } = currentToken);
    }
  }
  generateEmailToken(): IEmailConfirmationToken {
    this.logger.verbose(`With in generateEmailToken`);
    return {
      token: crypto.randomBytes(64).toString('hex'),
      expiryTimestamp: Math.floor(
        DateTime.now().plus({ hours: 8 }).toSeconds(),
      ),
    };
  }

  private async sendConfirmEmailRequest(
    email: string,
    token: string,
  ): Promise<void> {
    this.logger.verbose(`With in sendConfirmEmailRequest`);
    const url = `${process.env.UI_BASE_URL}/confirm-email?token=${token}`;

    const result = await this.mailService.send({
      to: email,
      subject: `[Origin] Confirm your email address`,
      html: `Welcome to the marketplace! Please click the link below to verify your email address: <br/> <br/> <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Confirm</a>.`,
    });

    if (result) {
      this.logger.log(`Notification email sent to ${email}.`);
    }
  }

  private async sendadminConfirmEmailRequest(
    email: string,
    password: string,
  ): Promise<void> {
    this.logger.verbose(`With in sendadminConfirmEmailRequest`);
    const url = `${process.env.UI_BASE_URL}/login`;

    const result = await this.mailService.send({
      to: email,
      subject: `[Origin] Welcome TO D-REC`,
      html: `Welcome to the marketplace!You are added in Drec platform, Please click the link below to login: <br/> <br/>
      <p>UserName:<b>${email}</b></p>
      <p> PassWord:<b>${password}</b></p>
      <p><a href="${url}"style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">click me</a>.</p>`,
    });

    if (result) {
      this.logger.log(`Notification email sent to ${email}.`);
    }
  }

  private async sendResetPasswordRequest(
    email: string,
    token: string,
    role?: string,
  ): Promise<void> {
    this.logger.verbose(`With in sendResetPasswordRequest`);
    const url = `${process.env.UI_BASE_URL}/reset-password?token=${token}&email=${email}&role=${role}`;

    const result = await this.mailService.send({
      to: email,
      subject: `[Origin] Reset your Password`,
      html: `Welcome to the marketplace! Please used token below to reset your Password: <br/> <h4>Token:${token}</h4> <br/><a href="${url}">${url}</a>.`,
    });

    if (result) {
      this.logger.log(`Notification email sent to ${email}.`);
    }
  }

  async remove(userId: number): Promise<void> {
    this.logger.verbose(`With in remove`);
    const allemialconfirm = await this.get(userId);
    await this.repository.delete(allemialconfirm.id);
  }

  public async sendInvitation(
    inviteuser: any,
    email: string,

    invitationId: number,
  ): Promise<void> {
    this.logger.verbose(`With in sendInvitation`);
    const url = `${process.env.UI_BASE_URL}/login`;

    const htmlTemplate = `
    <p> Dear ${email},<p>
    <p> you have been invited to register with D-REC from Organization <b>${inviteuser.orgName}</b></p>
    <p>Use your email and the password below to login into D-REC Initiative.<p>
    <p>
    Username: <b>${email}</b><br>
    Password: <b>${inviteuser.password}<b><p>
    <p><a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Click me</a></p>
   <hr>
    <p>Thank you<br>
    Best Regards
    <br>
    DREC initiative</p>
  `;

    const result = await this.mailService.send({
      to: email,
      subject: `[Origin] Organization Invitation`,
      html: htmlTemplate,
    });

    if (result) {
      this.logger.log(`Notification email sent to ${email}.`);
    }
  }
}
