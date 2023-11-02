import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2-client-password';
import { AuthService } from './auth.service';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import { UserService } from '../pods/user/user.service';
import { ClientPasswordStrategy } from './client-password.strategy';

import { Role } from '../utils/enums/role.enum';
import { EmailConfirmationService } from 'src/pods/email-confirmation/email-confirmation.service';

@Injectable()
export class ClientCredentialsStrategy extends PassportStrategy(
  ClientPasswordStrategy,
  'oauth2-client-password',
) {
  constructor(
    private readonly userService: UserService,
    private readonly emailConfirmationService: EmailConfirmationService, 
    private readonly authService: AuthService, 
    private readonly oAuthClientCredentialService: OauthClientCredentialsService) {
      super();
    }

  async validate(request : any, clientId: string, clientSecret: string) {
    let client : any;
    //const clientId = request.headers['client-id'];
    // const clientSecret = request.headers['client-secret'];
    // If client ID and client secret are present in the request, validate them
    console.log("cleint strategy came here");

    if(request.url.split('/')[3] === 'forget-password') {
      const user = await this.userService.findByEmail(request.body.email);
      request.user = user;
    }

    if((request.url.split('/')[3] === 'confirm-email') || (request.url.split('/')[3] === 'reset')) {
      const emailConfirmation = await this.emailConfirmationService.findOne({token : request.params.token});
      request.user = emailConfirmation.user;
    }

    if((request.url.split('/')[3] === 'forget-password') || (request.url.split('/')[3] === 'confirm-email') || (request.url.split('/')[3] != 'reset')) {
      if((!clientId || !clientSecret) && request.user.role === Role.ApiUser) {
        throw new UnauthorizedException({statusCode: 401, message:"client_id or client_secret missing from headers"}); 
      }
    }

    if (clientId && clientSecret) {
      // let clientData=this.oAuthClientCredentialService.generateClientCredentials()
      //this.oAuthClientCredentialService.store(clientData.client_id,clientData.client_secret,1);
      client = await this.validateClient(clientId, clientSecret);
      if(request.url.split('/')[3] != 'register') {
        const user = await this.userService.findOne({ api_user_id: client.api_user_id, role: Role.ApiUser });
        console.log("clientuser", user);

        if (!user) {
          console.log("when user not available in client strategy")
          throw new UnauthorizedException();
        }

        if(request.user.role != Role.ApiUser) {
          throw new UnauthorizedException();
        }  
      }

      if(((request.body.organizationType === Role.ApiUser) || (clientId === process.env.client_id))  &&  request.url.split('/')[3] === 'register') {
        throw new UnauthorizedException();
      }
      
      return request.user ?? client;
    }
    else {
      console.log("When the direct drec User")
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
          throw new UnauthorizedException({statusCode: 401, message:"client_id or client_secret missing from headers"}); 
        }
      }

      client = await this.validateClient(process.env.client_id, process.env.client_secret);

      if (!client) {
        throw new UnauthorizedException();
      }

      if(request.url.split('/')[3] != 'register') {
        
        if(request.user.api_user_id != client.api_user_id) {
          throw new UnauthorizedException();
        }
        if(client.client_id !=process.env.client_id  && request.user.role != Role.ApiUser) {
          throw new UnauthorizedException();
        }
        if((clientId || clientSecret) && request.user.role != Role.ApiUser) {
          throw new UnauthorizedException();
        }
      }

      return request.user ?? client;
    }
  }
  async validateClient(clientId: string, clientSecret: string): Promise<any> {
    // Implement your client ID and client secret validation logic here
    // Example: Fetch client information from the database and check if the provided client ID and client secret match
    const client = await this.oAuthClientCredentialService.findOneByclient_id(clientId);
    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }
    client.client_secret = this.oAuthClientCredentialService.decryptclient_secret(client.client_secret);
    console.log("client.client_secret", client.client_secret);
    console.log("clientSecret", clientSecret);
    if (client.client_secret !== clientSecret) {
      throw new UnauthorizedException('Invalid client credentials');
    }
    return client;
  }
}
