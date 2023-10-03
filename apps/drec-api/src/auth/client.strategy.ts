import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2-client-password';
import { AuthService } from './auth.service';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import { UserService } from '../pods/user/user.service';
import { ClientPasswordStrategy } from './client-password.strategy';
import { OauthClientCredentials } from 'src/pods/user/oauth_client_credentials.entity';



@Injectable()
export class ClientCredentialsStrategy extends PassportStrategy(
    ClientPasswordStrategy,
  'oauth2-client-password',
) {
  constructor(private readonly userService: UserService,private readonly authService: AuthService,private readonly oAuthClientCredentialService: OauthClientCredentialsService) {
    super();
  }

  async validate(clientId: string, clientSecret: string) {
    // const clientId = request.headers['client-id'];
    // const clientSecret = request.headers['client-secret'];
    // If client ID and client secret are present in the request, validate them
    console.log("cleint strategy came here",clientId, clientSecret);
    if (clientId && clientSecret) {
     // let clientData=this.oAuthClientCredentialService.generateClientCredentials()
     
      //this.oAuthClientCredentialService.store(clientData.client_id,clientData.client_secret,1);
      let user : OauthClientCredentials= await this.validateClient(clientId, clientSecret);
    /*  const user = await this.userService.findById(client.user.id);
      console.log("user",user); */
      console.log("user",user);
      if(user)
      {
        return user;
      }
      return null;
      
    }
    const user = await this.validateClient(clientId, clientSecret);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
  async validateClient(clientId: string, clientSecret: string): Promise<any> {
    // Implement your client ID and client secret validation logic here
    // Example: Fetch client information from the database and check if the provided client ID and client secret match
    const client = await this.oAuthClientCredentialService.findOneByclient_id(clientId);
    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }
    client.client_secret = this.oAuthClientCredentialService.decryptclient_secret(client.client_secret);
    console.log("client.client_secret",client.client_secret);
    console.log("clientSecret",clientSecret);
    if (client.client_secret !== clientSecret) {
      throw new UnauthorizedException('Invalid client credentials');
    }
    return client;
  }
}
