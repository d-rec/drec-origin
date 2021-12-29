/* eslint-disable no-unused-expressions */
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@energyweb/origin-backend-utils';

import { bootstrapTestInstance } from './drec-api';
import { UserService } from '../src/pods/user/user.service';
import { OrganizationService } from '../src/pods/organization/organization.service';
import { seed } from './seed';
import { expect } from 'chai';
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      configService,
    } = await bootstrapTestInstance());
    await databaseService.truncate('user', 'organization', 'device');

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
      password: 'Password123',
    };
    await loginUser(loggedUser);
    await requestAdminOrganization('', HttpStatus.FORBIDDEN);
  });

  it('should retrieve all organizations', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'Password123',
    };
    await loginUser(loggedUser);
    const { body: organizations } = await requestAdminOrganization(
      '',
      HttpStatus.OK,
    );
    expect(organizations).to.be.instanceOf(Array);
    expect(organizations).to.have.length(4);
  });

  it('should retrieve user`s organization', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'Password123',
    };
    await loginUser(loggedUser);
    const { body: organization } = await requestOrganization(
      'me',
      HttpStatus.OK,
    );
    expect(organization.name).to.equal('Buyer');
  });

  it('should retrieve all users from an organizations', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'Password123',
    };
    await loginUser(loggedUser);
    const { body: users } = await requestOrganization('users', HttpStatus.OK);
    expect(users).to.be.instanceOf(Array);
    expect(users).to.have.length(1);
  });

  it('should update an organization', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'Password123',
    };
    const partialOrg = {
      name: 'Device Owner - Update',
    };
    const orgs = await organizationService.getAll();
    await loginUser(loggedUser);
    const { body: updatedOrg } = await updateAdminOrganization(
      orgs[0]?.id.toString(),
      HttpStatus.OK,
      partialOrg,
    );
    expect(updatedOrg.name).to.equal('Device Owner - Update');
  });

  it('should return forbbidden when updating an organization', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'Password123',
    };
    const orgCode = 'D0012';
    const partialOrg = {
      code: 'D0012',
      name: 'Device Owner - Update',
      regAddress: 'Update',
    };
    await loginUser(loggedUser);
    await updateAdminOrganization(orgCode, HttpStatus.FORBIDDEN, partialOrg);
  });

  it('should return forbbidden when creating an organization', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'Password123',
    };
    const partialOrg: NewOrganizationDTO = {
      name: 'New Owner',
      address: 'Stet clita kasd gubergren',
      zipCode: 'Zip code',
      city: 'City',
      country: 'DE',
      businessType: 'Issuer',
      tradeRegistryCompanyNumber: '987654321',
      vatNumber: 'DE1000',
      signatoryFullName: 'New user',
      signatoryAddress: 'Address',
      signatoryZipCode: 'Zip Code',
      signatoryCity: 'City',
      signatoryCountry: 'DE',
      signatoryEmail: 'owner3@mailinator.com',
      signatoryPhoneNumber: 'Phone number',
    };
    await loginUser(loggedUser);
    await postOrganization('', HttpStatus.FORBIDDEN, partialOrg);
  });

  it('should delete an organization', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'Password123',
    };
    await loginUser(loggedUser);
    const { body: organizations } = await requestAdminOrganization(
      '',
      HttpStatus.OK,
    );
    expect(organizations).to.be.instanceOf(Array);
    expect(organizations).to.have.length(4);
    await deleteOrganization(
      organizations[organizations.length - 2].id.toString(),
      HttpStatus.OK,
    );
    const { body: afterDeleteOrgs } = await requestAdminOrganization(
      '',
      HttpStatus.OK,
    );
    expect(afterDeleteOrgs).to.be.instanceOf(Array);
    expect(afterDeleteOrgs).to.have.length(3);
  });

  const requestAdminOrganization = async (
    url: string,
    status: HttpStatus,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/admin/organizations/${url}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const requestOrganization = async (
    url: string,
    status: HttpStatus,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/organization/${url}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const updateAdminOrganization = async (
    url: string | null,
    status: HttpStatus,
    body: Partial<UpdateOrganizationDTO>,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .patch(`/admin/organizations/${url}`)
      .send({
        ...body,
      })
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const deleteOrganization = async (
    url: string | null,
    status: HttpStatus,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .delete(`/admin/organizations/${url}`)
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
