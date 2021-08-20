/* eslint-disable no-unused-expressions */
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'chai';
import { DatabaseService } from '@energyweb/origin-backend-utils';

import { bootstrapTestInstance } from './drec-api';
import { UserService } from '../src/pods/user/user.service';
import { OrganizationService } from '../src/pods/organization';
import { testOrgs, testUsers } from './seed';
import { before, after } from 'mocha';

describe('Authentication tests', () => {
  let app: INestApplication;
  let userService: UserService;
  let organizationService: OrganizationService;
  let databaseService: DatabaseService;

  before(async () => {
    ({ app, userService, organizationService, databaseService } =
      await bootstrapTestInstance());
    await databaseService.truncate('user');

    await app.init();
  });

  after(async () => {
    await app.close();
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  beforeEach(async () => {});

  afterEach(async () => {
    await databaseService.cleanUp();
  });

  it('should be able to log a buyer into the system', async () => {
    const [testUser] = testUsers;
    const [testOrg] = testOrgs;

    await userService.seed(testUser);
    await organizationService.seed(testOrg);

    const {
      body: { accessToken },
    } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: testUser.email,
        password: testUser.password,
      })
      .expect(HttpStatus.OK);

    expect(accessToken).to.exist;

    const { body: userData } = await request(app.getHttpServer())
      .get('/user/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK);

    expect(userData.email).to.equal(testUser.email);
  });
});
