import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OauthClientCredentials } from './oauth_client_credentials.entity';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { ApiUserEntity } from './api-user.entity';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import { Response } from 'express';

const algorithm = 'aes-256-cbc';

@Injectable()
export class OauthClientCredentialsService {
  private readonly logger = new Logger(OauthClientCredentialsService.name);

  constructor(
    @InjectRepository(OauthClientCredentials)
    private readonly clientCredentialsRepository: Repository<OauthClientCredentials>,
    @InjectRepository(ApiUserEntity)
    private readonly apiUserEntityRepository: Repository<ApiUserEntity>,
  ) {}

  async createAPIUser(): Promise<ApiUserEntity> {
    return await this.apiUserEntityRepository.save({ api_user_id: uuid() });
  }

  async store(
    client_id: string,
    userid: string,
  ): Promise<OauthClientCredentials> {
    const clientCredentials = new OauthClientCredentials();
    clientCredentials.client_id = client_id;
    clientCredentials.api_user_id = userid;
    return await this.clientCredentialsRepository.save(clientCredentials);
  }

  async get(api_user_id: string) {
    return await this.clientCredentialsRepository.findOne({
      where: {
        api_user_id: api_user_id,
      },
    });
  }

  async replace(
    id: number,
    client_id: string,
    userid: number,
  ): Promise<OauthClientCredentials> {
    const clientCredentials = await this.clientCredentialsRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!clientCredentials) {
      // Handle error, throw exception, etc.
    }
    clientCredentials.client_id = client_id;
    //clientCredentials.client_secret = client_secret;
    // clientCredentials.userid = userid;
    return await this.clientCredentialsRepository.save(clientCredentials);
  }

  async edit(id: number, client_id: string): Promise<OauthClientCredentials> {
    const clientCredentials = await this.clientCredentialsRepository.findOneBy({
      id: id,
    });
    if (!clientCredentials) {
      // Handle error, throw exception, etc.
    }
    clientCredentials.client_id = client_id;
    return await this.clientCredentialsRepository.save(clientCredentials);
  }

  generateClientCredentials(): { client_id: string; client_secret: string } {
    const client_id = randomBytes(16).toString('hex');
    const client_secret = randomBytes(32).toString('hex');
    return { client_id, client_secret: client_secret };
  }

  async findOneByclient_id(
    client_id: string,
  ): Promise<OauthClientCredentials | undefined> {
    return this.clientCredentialsRepository.findOne({ where: { client_id } });
  }

  async findOneByclient_idAndUserId(
    client_id: string,
    api_user_id: string,
  ): Promise<OauthClientCredentials | undefined> {
    return this.clientCredentialsRepository.findOne({
      where: {
        client_id: client_id,
        api_user_id: api_user_id,
      },
    });
  }
  async findOneByuserid(
    api_user_id: string,
  ): Promise<OauthClientCredentials | undefined> {
    return this.clientCredentialsRepository.findOne({ where: { api_user_id } });
  }

  async findOneByApiUserId(
    api_user_id: string,
  ): Promise<ApiUserEntity | undefined> {
    return await this.apiUserEntityRepository.findOne({
      where: { api_user_id },
    });
  }

  async generateKeys(api_user_id?: string) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    await this.store(publicKey, api_user_id);

    return privateKey;
  }

  async createKeyFile(api_user_id: string, res: Response) {
    try {
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=private_key.pem',
      );
      res.setHeader('Content-Type', 'application/octet-stream');
      const privateKey = await this.generateKeys(api_user_id); // Generate the private key using your service
      fs.writeFileSync('private_key.pem', privateKey); // Write the private key to a file
      const file = fs.readFileSync('private_key.pem'); // Read the file as a buffer
      return res.write(file, 'utf-8', () => {
        this.logger.verbose('The CSV file streamed successfully!');
        res.end();
      });
    } catch (error) {
      throw new HttpException(
        'Error Occured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
