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
import {
  NewOrganizationDTO,
  UpdateOrganizationDTO,
} from '../src/pods/organization/dto';
import { DeviceService } from '../src/pods/device/device.service';

describe('Organization tests', () => {
  let app: INestApplication;
  let organizationService: OrganizationService;
  let userService: UserService;
  let deviceService: DeviceService;
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let currentAccessToken: string;

  before(async () => {
    ({
      app,
      organizationService,
      userService,
      deviceService,
      databaseService,
      configService,
    } = await bootstrapTestInstance());
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
      deviceService,
    });
  });

  afterEach(async () => {
    await databaseService.cleanUp();
  });

  it('should receive forbidden when requestiong all organizations without appropiate role', async () => {
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

  it('should update an organization', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'test',
    };
    const orgCode = 'D0012';
    const partialOrg = {
      name: 'Device Owner - Update',
      regAddress: 'Update',
    };
    await loginConsumer(loggedUser);
    const { body: updatedOrg } = await updateOrganization(
      orgCode,
      HttpStatus.OK,
      partialOrg,
    );
    expect(updatedOrg.name).to.equal('Device Owner - Update');
    expect(updatedOrg.regAddress).to.equal('Update');
  });

  it('should return forbbidden when updating an organization', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'test',
    };
    const orgCode = 'D0012';
    const partialOrg = {
      code: 'D0012',
      name: 'Device Owner - Update',
      regAddress: 'Update',
    };
    await loginConsumer(loggedUser);
    await updateOrganization(orgCode, HttpStatus.FORBIDDEN, partialOrg);
  });

  it('should return forbbidden when creating an organization', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'test',
    };
    const partialOrg: NewOrganizationDTO = {
      code: 'D0013',
      name: 'New Owner',
      address: 'New address',
      primaryContact: 'New user',
      telephone: '81-3-6889-2713',
      email: 'owner3@mailinator.com',
      regNumber: '12345672189',
      vatNumber: '12345672189',
      regAddress: 'New address',
      country: 'DE',
      role: Role.DeviceOwner,
    };
    await loginConsumer(loggedUser);
    await postOrganization('', HttpStatus.FORBIDDEN, partialOrg);
  });

  const requestOrganization = async (
    url: string,
    status: HttpStatus,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/organization/${url}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const updateOrganization = async (
    url: string,
    status: HttpStatus,
    body: Partial<UpdateOrganizationDTO>,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .patch(`/organization/${url}`)
      .send({
        ...body,
      })
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const postOrganization = async (
    url: string,
    status: HttpStatus,
    body: NewOrganizationDTO,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .post(`/organization/${url}`)
      .send({
        ...body,
      })
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
