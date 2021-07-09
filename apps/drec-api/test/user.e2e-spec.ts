/* eslint-disable no-unused-expressions */
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@energyweb/origin-backend-utils';

import { bootstrapTestInstance } from './drec-api';
import { UserService } from '../src/pods/user/user.service';
import { OrganizationService } from '../src/pods/organization';
import { seed } from './seed';
import { expect } from 'chai';

describe('Users tests', () => {
  let app: INestApplication;
  let organizationService: OrganizationService;
  let userService: UserService;
  let databaseService: DatabaseService;
  let configService: ConfigService;

  let currentAccessToken: string;

  beforeEach(async () => {
    ({ app, organizationService, userService, databaseService, configService } =
      await bootstrapTestInstance());
    await databaseService.truncate('user', 'organization');

    await app.init();
    await seed({
      userService,
      organizationService,
    });
  });

  afterEach(async () => {
    await databaseService.cleanUp();
    await app.close();
  });

  it('should receive unauthorized when requesting users without loggin in', async () => {
    await requestUsers('me', HttpStatus.UNAUTHORIZED);
  });

  it('should retrieve user`s details', async () => {
    const loggedUser = {
      email: 'owner2@mailinator.com',
      password: 'test',
    };
    await loginConsumer(loggedUser);
    const { body: user } = await requestUsers('me', HttpStatus.OK);
    expect(user.username).to.equal('JaneWilliams');
    expect(user.email).to.equal('owner2@mailinator.com');
    expect(user.organizationId).to.equal('D0012');
  });

  const requestUsers = async (url: string, status: HttpStatus): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/user/${url}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const loginConsumer = async (loggedUser: {
    email: string;
    password: string;
  }): Promise<any> => {
    const {
      body: { accessToken },
    } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: loggedUser.email,
        password: loggedUser.password,
      })
      .expect(HttpStatus.OK);

    currentAccessToken = accessToken;
  };
});
