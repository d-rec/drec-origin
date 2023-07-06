import { Injectable, Inject,CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';

@Injectable()
export class JwtOrClientIdSecretAuthGuard extends AuthGuard('jwt') implements CanActivate {
    constructor(@Inject(OauthClientCredentialsService) private readonly oAuthClientCredentialService: OauthClientCredentialsService) {
        super();
      }
    
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.headers['client-id'];
    const clientSecret = request.headers['client-secret'];

    // Check if client ID and client secret are present in the headers
    if (clientId && clientSecret) {
      return this.validateClient(clientId, clientSecret);
    }
    return super.canActivate(context); // Fall back to JWT token authentication
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
    return true;
  }
}