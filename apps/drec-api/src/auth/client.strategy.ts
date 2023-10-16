import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2-client-password';
import { AuthService } from './auth.service';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import { UserService } from '../pods/user/user.service';
import { ClientPasswordStrategy } from './client-password.strategy';

import { Role } from '../utils/enums/role.enum';

@Injectable()
export class ClientCredentialsStrategy extends PassportStrategy(
  ClientPasswordStrategy,
  'oauth2-client-password',
) {
  constructor(private readonly userService: UserService, private readonly authService: AuthService, private readonly oAuthClientCredentialService: OauthClientCredentialsService) {
    super();
  }

  async validate(request : any, clientId: string, clientSecret: string) {
    //const clientId = request.headers['client-id'];
    // const clientSecret = request.headers['client-secret'];
    // If client ID and client secret are present in the request, validate them
    console.log("cleint strategy came here", clientId, clientSecret);
    if (clientId && clientSecret) {
      // let clientData=this.oAuthClientCredentialService.generateClientCredentials()
      //this.oAuthClientCredentialService.store(clientData.client_id,clientData.client_secret,1);
      let client = await this.validateClient(clientId, clientSecret);
      const user = await this.userService.findOne({ api_user_id: client.api_user_id, role: Role.ApiUser });
      console.log("clientuser", user);
      if (!user) {
        console.log("when user not available in client strategy")
        throw new UnauthorizedException();
      } 
      if(request.user.role != Role.ApiUser) {
        throw new UnauthorizedException();
      }
      return request.user;
    }
    console.log("When the direct drec User")
    const client = await this.validateClient(process.env.client_id, process.env.client_secret);
    console.log("Drec User:",client);
    if (!client) {
      throw new UnauthorizedException();
    }
    if(request.user.api_user_id != client.api_user_id) {
      throw new UnauthorizedException();
    }
    return request.user;
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
