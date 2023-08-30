import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import { Repository, FindConditions, } from 'typeorm';
import { MailService } from '../../mail';
import { IEmailConfirmationToken, ISuccessResponse, IUser } from '../../models';
import { EmailConfirmationResponse } from '../../utils/enums';
import { OrganizationDTO } from '../organization/dto';
import { User } from '../user/user.entity';
import { EmailConfirmation } from './email-confirmation.entity';
export interface SuccessResponse {
  success: boolean,
  message: string,
}
@Injectable()
export class EmailConfirmationService {
  private readonly logger = new Logger(EmailConfirmationService.name);

  constructor(
    @InjectRepository(EmailConfirmation)
    private readonly repository: Repository<EmailConfirmation>,
    private mailService: MailService,
  ) { }

  public async create(user: User): Promise<EmailConfirmation> {
    const exists = await this.repository.findOne({
      where: {
        user: { email: user.email }
      },
      relations: ['user']
    });

    if (exists) {
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
  async findOne(conditions: FindConditions<EmailConfirmation>): Promise<EmailConfirmation | undefined> {
    const user = await (this.repository.findOne(conditions, {
      relations: ['user'],

    }) as Promise<EmailConfirmation> as Promise<EmailConfirmation | undefined>);



    return user;
  }
  async confirmEmail(
    token: IEmailConfirmationToken['token'],
  ): Promise<SuccessResponse> {
    const emailConfirmation = await this.repository.findOne({ token });

    if (!emailConfirmation) {
      throw new BadRequestException({
        success: false,
        message: `Email confirmation doesn't exist`,
      });
    }

    if (emailConfirmation.confirmed === true) {
      return {
        success: false,
        message: EmailConfirmationResponse.AlreadyConfirmed,
      };
    }

    if (
      emailConfirmation.expiryTimestamp < Math.floor(DateTime.now().toSeconds())
    ) {
      return {
        success: false,
        message: EmailConfirmationResponse.Expired,
      };
    }

    await this.repository.update(emailConfirmation.id, {
      confirmed: true,
    });

    return {
      success: true,
      message: EmailConfirmationResponse.Success
    }
  }

  public async sendConfirmationEmail(
    email: IUser['email'],
  ): Promise<ISuccessResponse> {
    const currentToken = await this.getByEmail(email);
    console.log(currentToken)
    if (!currentToken) {
      return {
        message: 'Token not found',
        success: false,
      };
    }

    const { id, confirmed } = currentToken;
    console.log(confirmed)
    if (confirmed === true) {
      throw new BadRequestException({
        success: false,
        message: `Email already confirmed`,
      });
    }
    let { token, expiryTimestamp } = await this.generatetoken(currentToken, id)

    await this.sendConfirmEmailRequest(email.toLowerCase(), token);

    return {
      success: true,
    };
  }

  public async ConfirmationEmailForResetPassword(
    email: IUser['email'],
  ): Promise<ISuccessResponse> {
    const currentToken = await this.getByEmail(email);

    if (!currentToken) {
      return {
        message: "Email not found or Email not registered",
        success: false,
      };
    }
    const { id, confirmed } = currentToken;
    let { token, expiryTimestamp } = await this.generatetoken(currentToken, id);

    await this.sendResetPasswordRequest(email.toLowerCase(), token);

    return {
      success: true,
      message: 'Password Reset Mail has been sent to your authorized Email.',
    };
  }
  public async generatetoken(currentToken, id) {
   
    let { token, expiryTimestamp } = currentToken;


    if (expiryTimestamp < Math.floor(DateTime.now().toSeconds())) {
      const newToken = this.generateEmailToken();
      await this.repository.update(id, newToken);

      return ({ token, expiryTimestamp } = newToken);
    }else{
      return ({ token, expiryTimestamp } = currentToken);
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
  private async sendConfirmEmailRequest(
    email: string,
    token: string,
  ): Promise<void> {
    const url = `${process.env.UI_BASE_URL}/confirm-email?token=${token}`;

    const result = await this.mailService.send({
      to: email,
      subject: `[Origin] Confirm your email address`,
      html: `Welcome to the marketplace! Please click the link below to verify your email address: <br/> <br/> <a href="${url}">${url}</a>.`,
    });

    if (result) {
      this.logger.log(`Notification email sent to ${email}.`);
    }
  }

  private async sendResetPasswordRequest(
    email: string,
    token: string,
  ): Promise<void> {
    const url = `${process.env.UI_BASE_URL}/reset-password?token=${token}&email=${email}`;

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

    const allemialconfirm = await this.get(userId)
    console.log('allemialconfirl', allemialconfirm.id)
    await this.repository.delete(allemialconfirm.id);
  }


  // private async sendInvitation(
  //   organization: string,
  //   email: string,
  //   token: string,
  // ): Promise<void> {
  //   const url = `${process.env.UI_BASE_URL}`;

  //   const result = await this.mailService.send({
  //     to: email,
  //     subject: `[Origin] Organization invitation`,
  //     html: `Organization <b>${organization}</b> has invited you to join. To accept the invitation,<br> 
  //    <b> Please click the button to confirm your email: </b> <a href="${url}/confirm-email?token=${token}">Confirme</a>.<br>
  //     <b> and Please change password: </b> <a href="${url}/reset-password?token=${token}&email=${email}">Add Password</a><br>
  //    and then login and visit`,
  //   });

  //   if (result) {
  //     this.logger.log(`Notification email sent to ${email}.`);
  //   }
  // }

  public async sendInvitation(
    organization: string,
    email: string,
    token: string
  ): Promise<void> {
    const url = `${process.env.UI_BASE_URL}`;

    const htmlTemplate = `
      <p>Organization <b>${organization}</b> has invited you to join.</p>
      <p>To accept the invitation, please change your password using the following link :</p>
      <p><a href="${url}/reset-password?token=${token}&email=${email}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Add Password</a></p>
      <p>After changing your password, you can log in and visit the your invitation details in website.</p>
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
