/* eslint-disable no-unused-expressions */
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'chai';
import { DatabaseService } from '@energyweb/origin-backend-utils';
import { ConfigService } from '@nestjs/config';
import { bootstrapTestInstance } from './drec-api';
import { UserService } from '../src/pods/user/user.service';
import { OrganizationService } from '../src/pods/organization/organization.service';
import { DeviceService } from '../src/pods/device/device.service';
import { seed } from './seed';

describe('Authentication tests', () => {
  let app: INestApplication;
  let organizationService: OrganizationService;
  let userService: UserService;
  let deviceService: DeviceService;
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let currentAccessToken: string;

  beforeEach(async () => {
    ({
      app,
      organizationService,
      userService,
      deviceService,
      databaseService,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      configService,
    } = await bootstrapTestInstance());
    await databaseService.truncate('user', 'organization', 'device');

    await app.init();
    await seed({
      userService,
      organizationService,
      deviceService,
    });
  });

  afterEach(async () => {
    await databaseService.cleanUp();
    await app.close();
  });

  it('should be able to log a buyer into the system', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: '******123',
    };
    await loginUser(loggedUser);
    expect(currentAccessToken).to.exist;

    const { body: userData } = await request(app.getHttpServer())
      .get('/user/me')
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(HttpStatus.OK);

    expect(userData.email).to.equal(loggedUser.email);
  });

  const loginUser = async (loggedUser: {
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
