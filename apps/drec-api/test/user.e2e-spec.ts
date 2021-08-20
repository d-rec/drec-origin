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
import { DeviceService } from '../src/pods/device/device.service';
import { NewOrganizationDTO } from '../src/pods/organization/dto';
import { OrganizationStatus, Role, UserStatus } from '../src/utils/eums';
import { CreateUserDTO } from '../src/pods/user/dto/create-user.dto';

describe('Users tests', () => {
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
    await databaseService.truncate('user', 'organization');

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

  it('should receive unauthorized when requesting users without loggin in', async () => {
    await requestUsers('me', HttpStatus.UNAUTHORIZED);
  });

  it('should retrieve user`s details', async () => {
    const loggedUser = {
      email: 'owner2@mailinator.com',
      password: 'test',
    };
    await loginUser(loggedUser);
    const { body: user } = await requestUsers('me', HttpStatus.OK);
    expect(user.username).to.equal('JaneWilliams');
    expect(user.email).to.equal('owner2@mailinator.com');
    expect(user.organizationId).to.equal('D0012');
  });

  it('should create a new user', async () => {
    const organization = await getNewOrganization();
    const partialUser: CreateUserDTO = {
      title: 'Mr',
      firstName: 'test',
      lastName: 'user2021',
      email: 'testNew2021@mailinator.com',
      telephone: 'telephone',
      password: 'test',
      role: Role.Admin,
      organizationId: organization.id,
    };
    await postUser('', HttpStatus.CREATED, partialUser);
  });

  const getNewOrganization = async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'test',
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
      status: OrganizationStatus.Active,
      signatoryFullName: 'Jane Doe',
      signatoryAddress: 'Address',
      signatoryZipCode: 'Zip Code',
      signatoryCity: 'City',
      signatoryCountry: 'DE',
      signatoryEmail: 'owner3@mailinator.com',
      signatoryPhoneNumber: 'Phone number',
    };
    await loginUser(loggedUser);
    const { body: organization } = await postOrganization(
      '',
      HttpStatus.CREATED,
      partialOrg,
    );
    return organization;
  };

  const requestUsers = async (url: string, status: HttpStatus): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/user/${url}`)
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

  const postUser = async (
    url: string,
    status: HttpStatus,
    body: CreateUserDTO,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .post(`/user/${url}`)
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
