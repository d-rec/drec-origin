import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
  constructor(
    @InjectRepository(OauthClientCredentials)
    private readonly clientCredentialsRepository: Repository<OauthClientCredentials>,
    @InjectRepository(ApiUserEntity)
    private readonly apiUserEntityRepository: Repository<ApiUserEntity>,
  ) {}

  async createAPIUser(): Promise<ApiUserEntity> {
    // @ts-ignore
    return await this.apiUserEntityRepository.save({ api_user_id: uuid() });
  }

  async store(
    client_id: string,
    userid: string,
  ): Promise<OauthClientCredentials> {
    const clientCredentials = new OauthClientCredentials();
    clientCredentials.client_id = client_id;
    //clientCredentials.client_secret = this.encryptclient_secret(client_secret);
    clientCredentials.api_user_id = userid;
    return await this.clientCredentialsRepository.save(clientCredentials);
  }

  async get(api_user_id: string) {
    return await this.clientCredentialsRepository.findOne({
      api_user_id: api_user_id,
    });
  }

  async replace(
    id: number,
    client_id: string,
    userid: number,
  ): Promise<OauthClientCredentials> {
    const clientCredentials =
      await this.clientCredentialsRepository.findOne(id);
    if (!clientCredentials) {
      // Handle error, throw exception, etc.
    }
    clientCredentials.client_id = client_id;
    //clientCredentials.client_secret = client_secret;
    // clientCredentials.userid = userid;
    return await this.clientCredentialsRepository.save(clientCredentials);
  }

  async edit(id: number, client_id: string): Promise<OauthClientCredentials> {
    const clientCredentials =
      await this.clientCredentialsRepository.findOne(id);
    if (!clientCredentials) {
      // Handle error, throw exception, etc.
    }
    clientCredentials.client_id = client_id;
    //clientCredentials.client_secret = this.encryptclient_secret(client_secret);
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
    api_user_id: number,
  ): Promise<OauthClientCredentials | undefined> {
    return this.clientCredentialsRepository.findOne({
      where: { client_id, api_user_id },
    });
  }
  async findOneByuserid(
    api_user_id: string,
  ): Promise<OauthClientCredentials | undefined> {
    return this.clientCredentialsRepository.findOne({ where: { api_user_id } });
  }
  /*
  encryptclient_secret(client_secret) {
    console.log(algorithm, process.env.CLIENT_CREDENTIALS_ENCRYPTION_KEY);
    const iv = randomBytes(16); // Generate a random IV

    const cipher = createCipheriv(
      algorithm,
      process.env.CLIENT_CREDENTIALS_ENCRYPTION_KEY,
      iv,
    );
    let encrypted = cipher.update(client_secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + encrypted;
  }

  decryptclient_secret(encryptedclient_secret) {
    const iv = Buffer.from(encryptedclient_secret.slice(0, 32), 'hex');

    const decipher = createDecipheriv(
      algorithm,
      process.env.CLIENT_CREDENTIALS_ENCRYPTION_KEY,
      iv,
    );
    let decrypted = decipher.update(
      encryptedclient_secret.slice(32),
      'hex',
      'utf8',
    );
    decrypted += decipher.final('utf8');
    return decrypted;
  }
*/
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
      const privateKey = await this.generateKeys(api_user_id); // Generate the private key using your service
      fs.writeFileSync('private_key.pem', privateKey); // Write the private key to a file
      const file = fs.readFileSync('private_key.pem'); // Read the file as a buffer
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=private_key.pem',
      );
      res.setHeader('Content-Type', 'application/octet-stream');
      //res.send(file);
      res.write(file, 'utf-8', () => {
        console.log('The CSV file streamed successfully!');
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
