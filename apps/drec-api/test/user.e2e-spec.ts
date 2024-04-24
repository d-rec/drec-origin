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
import { DeviceService } from '../src/pods/device/device.service';
// @ts-ignore ts(2305)
import { CreateUserDTO } from '../src/pods/user/dto/create-user.dto';
import { UserRegistrationData } from '../src/models';
import { UpdateUserProfileDTO } from '../src/pods/user/dto/update-user-profile.dto';
import { UpdateOwnUserSettingsDTO } from '../src/pods/user/dto/update-own-user-settings.dto';

export const userToRegister: UserRegistrationData = {
  title: 'Mr',
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@example.com',
  password: 'thisIsAPassword',
  telephone: '+11',
};

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
      password: 'Password123',
    };
    await loginUser(loggedUser);
    const { body: user } = await requestUsers('me', HttpStatus.OK);
    expect(user.firstName).to.equal('Jane');
    expect(user.lastName).to.equal('Williams');
    expect(user.email).to.equal('owner2@mailinator.com');
    const newLoggedUser = {
      email: 'admin2@mailinator.com',
      password: 'Password123',
    };
    await loginUser(newLoggedUser);
    await requestUsers(user.id, HttpStatus.OK);
  });

  it('should create a new user', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'Password123',
    };
    await loginUser(loggedUser);
    const partialUser: CreateUserDTO = {
      title: 'Mr',
      firstName: 'test',
      lastName: 'user2021',
      email: 'test-1-2021@mailinator.com',
      telephone: 'telephone',
      password: 'testUser2',
    };
    await postAdminUser('', HttpStatus.CREATED, partialUser);
  });

  it('should register a new user', async () => {
    const partialUser: CreateUserDTO = {
      title: 'Mr',
      firstName: 'test',
      lastName: 'user2021',
      email: 'test-2-2021@mailinator.com',
      telephone: 'telephone',
      password: 'testUser2',
    };
    await postUser('register', HttpStatus.CREATED, partialUser);
  });

  it('should update profile for user', async () => {
    const partialUser: UpdateUserProfileDTO = {
      // @ts-ignore ts(2353)
      title: 'Mr',
      firstName: 'Updated first name',
      lastName: 'Updated last name',
      email: 'updated@mailinator.com',
      telephone: 'Updated telephone',
    };
    const { body: updatedUser } = await request(app.getHttpServer())
      .put(`/user/profile`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .send(partialUser)
      .expect(HttpStatus.OK);
    expect(updatedUser.firstName).to.eq(partialUser.firstName);
    expect(updatedUser.lastName).to.eq(partialUser.lastName);
    expect(updatedUser.email).to.eq(partialUser.email);
    // @ts-ignore ts(2339)
    expect(updatedUser.telephone).to.eq(partialUser.telephone);
  });

  it('should update notifications for user', async () => {
    const partialUser: UpdateOwnUserSettingsDTO = {
      notifications: true,
    };
    const { body: updatedUser } = await request(app.getHttpServer())
      .put(`/user`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .send(partialUser)
      .expect(HttpStatus.OK);
    expect(updatedUser.notifications).to.eq(true);
  });

  const requestUsers = async (url: string, status: HttpStatus): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/user/${url}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const postAdminUser = async (
    url: string,
    status: HttpStatus,
    body: CreateUserDTO,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .post(`/admin/users/${url}`)
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
