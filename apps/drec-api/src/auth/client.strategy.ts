import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import { UserService } from '../pods/user/user.service';
import { ClientPasswordStrategy } from './client-password.strategy';
import { Role } from '../utils/enums/role.enum';
import { EmailConfirmationService } from '../pods/email-confirmation/email-confirmation.service';

@Injectable()
export class ClientCredentialsStrategy extends PassportStrategy(
  ClientPasswordStrategy,
  // 'oauth2-client-password',
) {
  private readonly logger = new Logger(ClientCredentialsStrategy.name);

  constructor(
    private readonly userService: UserService,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly authService: AuthService,
    private readonly oAuthClientCredentialService: OauthClientCredentialsService,
  ) {
    super();
  }

  async validate(request: any, clientId: string, clientSecret: string) {
    /*
    let client : any;
    //const clientId = request.headers['client-id'];
    // const clientSecret = request.headers['client-secret'];
    // If client ID and client secret are present in the request, validate them
    this.logger.verbose("With in validate");

    if(request.url.split('/')[3] === 'forget-password') {
      const user = await this.userService.findByEmail(request.body.email);
      if(!user) {
        this.logger.error(`The requested email ${request.body.email} is not registered with us.. Please check your email...`);
        throw new UnauthorizedException({statusCode: 401, message:`The requested email ${request.body.email} is not registered with us.. Please check your email...`});
      }
      request.user = user;
    }

    if((request.url.split('/')[3] === 'confirm-email') || (request.url.split('/')[3] === 'reset')) {
      const emailConfirmation = await this.emailConfirmationService.findOne({token : request.params.token});
      request.user = emailConfirmation.user;
    }

    if((request.url.split('/')[3] === 'forget-password') || (request.url.split('/')[3] === 'confirm-email') || (request.url.split('/')[3] === 'reset')) {
      if((!clientId || !clientSecret) && request.user.role === Role.ApiUser) {
        this.logger.error(`client_id or client_secret missing from headers at ${request.url.split('/')[3]}`);
        throw new UnauthorizedException({statusCode: 401, message:"client_id or client_secret missing from headers"}); 
      }
    }

    if (clientId && clientSecret) {
      this.logger.verbose("When client credentials available at headers");
      // let clientData=this.oAuthClientCredentialService.generateClientCredentials()
      //this.oAuthClientCredentialService.store(clientData.client_id,clientData.client_secret,1);
      client = await this.validateClient(clientId, clientSecret);
      if((request.user != undefined) && (request.user.api_user_id != client.api_user_id)) {
        this.logger.error(`Client credentials and authorization is mismatching.. Invalid client credentials..`);
        throw new UnauthorizedException({
          statusCode: 401, 
          message:"Client credentials and authorization is mismatching.. Invalid client credentials.."
        }); 
      }

      if(request.url.split('/')[3] != 'register') {
        const user = await this.userService.findOne({ api_user_id: client.api_user_id, role: Role.ApiUser });
      
        if (!user) {
          this.logger.error(`When user not available in client strategy at ${request.url.split('/')[3]}`);
          throw new UnauthorizedException();
        }

        if(request.user.role != Role.ApiUser) {
          this.logger.error(`When user role is not an ApiUser in ${request.url.split('/')[3]}`);
          throw new UnauthorizedException();
        }  
      }

      if(((request.body.organizationType === Role.ApiUser) || (clientId === process.env.client_id))  &&  request.url.split('/')[3] === 'register') {
        this.logger.error(`When an ApiUser logged in using the admin's client`);
        throw new UnauthorizedException();
      }
      
      return request.user ?? client;
    }
    else {
      this.logger.verbose('When the direct drec user');
      if(request.url.split('/')[3] === 'register') {
        if(request.body.organizationType === Role.ApiUser) {
          const clienCredentialsData = await this.oAuthClientCredentialService.generateClientCredentials();
          const api_user = await this.oAuthClientCredentialService.createAPIUser();
          client = await this.oAuthClientCredentialService.store(clienCredentialsData.client_id, clienCredentialsData.client_secret,api_user.api_user_id);
          return {
            client_id : clienCredentialsData.client_id,
            client_secret : clienCredentialsData.client_secret,
            api_user_id : api_user.api_user_id
          };
        }

        if(((!clientId && clientSecret) || (clientId && !clientSecret)) && request.body.organizationType != Role.ApiUser) {
          this.logger.error(`client_id or client_secret missing from headers`);
          throw new UnauthorizedException({statusCode: 401, message:"client_id or client_secret missing from headers"}); 
        }
      }

      client = await this.validateClient(process.env.client_id, process.env.client_secret);

      if (!client) {
        this.logger.error('When there is no client available');
        throw new UnauthorizedException();
      }

      if(request.url.split('/')[3] != 'register') {
        
        if(request.user.api_user_id != client.api_user_id) {
          this.logger.error('When the api_user_id mismatches');
          throw new UnauthorizedException();
        }
        if(client.client_id !=process.env.client_id  && request.user.role != Role.ApiUser) {
          this.logger.error('When the clientId mismatches');
          throw new UnauthorizedException();
        }
        if((clientId || clientSecret) && request.user.role != Role.ApiUser) {
          this.logger.error('When the client credentials are available');
          throw new UnauthorizedException();
        }
      }

      return request.user ?? client;
    } */
  }
  async validateClient(clientId: string, clientSecret: string): Promise<any> {
    /*
    this.logger.verbose('With in the validateClient');
    // Implement your client ID and client secret validation logic here
    // Example: Fetch client information from the database and check if the provided client ID and client secret match
    const client = await this.oAuthClientCredentialService.findOneByclient_id(clientId);
    if (!client) {
      this.logger.error('Invalid client credentials');
      throw new UnauthorizedException('Invalid client credentials');
    }
    client.client_secret = this.oAuthClientCredentialService.decryptclient_secret(client.client_secret);
    // console.log("client.client_secret", client.client_secret);
    // console.log("clientSecret", clientSecret);
    if (client.client_secret !== clientSecret) {
      this.logger.error('Invalid client credentials');
      throw new UnauthorizedException('Invalid client credentials');
    }
    return client; */
  }
}
