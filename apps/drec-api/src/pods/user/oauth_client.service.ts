import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OauthClientCredentials } from './oauth_client_credentials.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class ClientCredentialsService {
    constructor(
        @InjectRepository(OauthClientCredentials)
        private readonly clientCredentialsRepository: Repository<OauthClientCredentials>,
    ) { }


    async store(clientId: string, clientSecret: string, userId: number): Promise<OauthClientCredentials> {
        const clientCredentials = new OauthClientCredentials();
        clientCredentials.clientId = clientId;
        clientCredentials.clientSecret = clientSecret;
        //clientCredentials.userId = userId;
        return await this.clientCredentialsRepository.save(clientCredentials);
    }



    async replace(id: number, clientId: string, clientSecret: string, userId: number): Promise<OauthClientCredentials> {
        const clientCredentials = await this.clientCredentialsRepository.findOne(id);
        if (!clientCredentials) {
            // Handle error, throw exception, etc.
        }
        clientCredentials.clientId = clientId;
        clientCredentials.clientSecret = clientSecret;
        // clientCredentials.userId = userId;
        return await this.clientCredentialsRepository.save(clientCredentials);
    }



    async edit(id: number, clientId: string, clientSecret: string): Promise<OauthClientCredentials> {
        const clientCredentials = await this.clientCredentialsRepository.findOne(id);
        if (!clientCredentials) {
            // Handle error, throw exception, etc.
        }
        clientCredentials.clientId = clientId;
        clientCredentials.clientSecret = clientSecret;
        return await this.clientCredentialsRepository.save(clientCredentials);
    }



    generateClientCredentials(): { clientId: string, clientSecret: string } {
        const clientId = randomBytes(16).toString('hex');
        const clientSecret = randomBytes(32).toString('hex');
        return { clientId, clientSecret };

    }

    async findOneByClientId(clientId: string): Promise<OauthClientCredentials | undefined> {
        return this.clientCredentialsRepository.findOne({ where: { clientId } });
    }

    async findOneByClientIdAndUserId(clientId: string, userId: number)
        : Promise<OauthClientCredentials | undefined> {
        return this.clientCredentialsRepository.findOne({ where: { clientId, userId } });
    }
    async findOneByUserId(userId: number): Promise<OauthClientCredentials | undefined> {
        return this.clientCredentialsRepository.findOne({ where: { userId } });
    }

}