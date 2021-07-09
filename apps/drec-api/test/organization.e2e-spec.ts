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
import { Role } from '..//src/utils/eums/role.enum';
import { before, after } from 'mocha';

describe('Organization tests', () => {
  let app: INestApplication;
  let organizationService: OrganizationService;
  let userService: UserService;
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let currentAccessToken: string;

  before(async () => {
    ({ app, organizationService, userService, databaseService, configService } =
      await bootstrapTestInstance());
    await databaseService.truncate('user', 'organization');

    await app.init();
  });

  after(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await seed({
      userService,
      organizationService,
    });
  });

  afterEach(async () => {
    await databaseService.cleanUp();
  });

  it('should receive forbidden when recieving 403', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'test',
    };
    await loginConsumer(loggedUser);
    await requestOrganization('', HttpStatus.FORBIDDEN);
  });

  it('should retrieve all organizations', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'test',
    };
    await loginConsumer(loggedUser);
    const { body: organizations } = await requestOrganization(
      '',
      HttpStatus.OK,
    );
    expect(organizations).to.be.instanceOf(Array);
    expect(organizations).to.have.length(3);
  });

  it('should retrieve user`s organization', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'test',
    };
    await loginConsumer(loggedUser);
    const { body: organization } = await requestOrganization(
      'me',
      HttpStatus.OK,
    );
    expect(organization.code).to.equal('B0012');
    expect(organization.name).to.equal('Buyer');
    expect(organization.country).to.equal('DE');
    expect(organization.role).to.equal(Role.Buyer);
  });

  it('should retrieve all users from an organizations', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'test',
    };
    await loginConsumer(loggedUser);
    const { body: users } = await requestOrganization('users', HttpStatus.OK);
    expect(users).to.be.instanceOf(Array);
    expect(users).to.have.length(1);
    expect(users[0].organizationId).to.equal('B0012');
  });

  const requestOrganization = async (
    url: string,
    status: HttpStatus,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/organization/${url}`)
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
