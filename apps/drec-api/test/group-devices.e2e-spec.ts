/* eslint-disable no-unused-expressions */
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@energyweb/origin-backend-utils';

import { bootstrapTestInstance } from './drec-api';
import { UserService } from '../src/pods/user/user.service';
import { OrganizationService } from '../src/pods/organization';
import { seed, testOrgs } from './seed';
import { expect } from 'chai';
import { before, after } from 'mocha';
import { DeviceService } from '../src/pods/device/device.service';
import {
  NewDeviceGroupDTO,
  UpdateDeviceGroupDTO,
} from '../src/pods/device-group/dto';
import { DeviceGroupService } from '../src/pods/device-group/device-group.service';
import { Device } from '../src/pods/device';

describe('Device Group tests', () => {
  let app: INestApplication;
  let organizationService: OrganizationService;
  let userService: UserService;
  let deviceService: DeviceService;
  let deviceGroupService: DeviceGroupService;
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
    await databaseService.truncate('user', 'device', 'organization');

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

  it('should create a device group', async () => {
    const { body: createdGroup } = await createDeviceGroup();
    expect(createdGroup.name).to.eq('test-device-group');
  });

  it('should update a device group', async () => {
    const { body: createdGroup } = await createDeviceGroup();
    const updateDeviceGrouo: UpdateDeviceGroupDTO = {
      name: 'updated-device-group',
    };
    const { body: updatedDevice } = await updateDeviceGroup(
      createdGroup.id,
      HttpStatus.OK,
      updateDeviceGrouo,
    );
    expect(updatedDevice.name).to.equal('updated-device-group');
  });

  it('should return Not Acceptable when creating a group with device from different owner', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'test',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK);
    const firstBatch = devices.filter(
      (device: Device) =>
        device.registrant_organisation_code === testOrgs[0].code,
    );
    const secondBatch = devices.filter(
      (device: Device) =>
        device.registrant_organisation_code === testOrgs[3].code,
    );
    const newDeviceGroup: NewDeviceGroupDTO = {
      name: 'test-device-group-2',
      deviceIds: [firstBatch[0], secondBatch[0]],
    };
    await postDeviceGroup('', HttpStatus.NOT_ACCEPTABLE, newDeviceGroup);
  });

  it('should retrieve all device groups', async () => {
    await createDeviceGroup();
    const { body: deviceGroups } = await requestDeviceGroup('', HttpStatus.OK);
    expect(deviceGroups).to.be.instanceOf(Array);
    expect(deviceGroups).to.have.length(1);
  });

  it('should retrieve device group by id', async () => {
    await createDeviceGroup();
    const { body: deviceGroups } = await requestDeviceGroup('', HttpStatus.OK);
    const { body: deviceGroup } = await requestDeviceGroup(
      deviceGroups[0].id,
      HttpStatus.OK,
    );
    expect(deviceGroup.name).to.equal('test-device-group');
    expect(deviceGroup.devices).to.be.instanceOf(Array);
    expect(deviceGroup.devices).to.have.length(1);
  });

  it('should delete device group', async () => {
    await createDeviceGroup();
    const { body: deviceGroups } = await requestDeviceGroup('', HttpStatus.OK);
    await deleteDeviceGroup(deviceGroups[0].id, HttpStatus.OK);
  });

  const createDeviceGroup = async (): Promise<any> => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'test',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK);
    const firstBatch = devices.filter(
      (device: Device) =>
        device.registrant_organisation_code === testOrgs[0].code,
    );
    const newDeviceGroup: NewDeviceGroupDTO = {
      name: 'test-device-group',
      deviceIds: [firstBatch[0]],
    };
    return await postDeviceGroup('', HttpStatus.CREATED, newDeviceGroup);
  };

  const requestDevice = async (url: string, status: HttpStatus): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/device/${url}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const requestDeviceGroup = async (
    url: string,
    status: HttpStatus,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/device-group/${url}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const updateDeviceGroup = async (
    url: string,
    status: HttpStatus,
    body: Partial<UpdateDeviceGroupDTO>,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .patch(`/device-group/${url}`)
      .send({
        ...body,
      })
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const postDeviceGroup = async (
    url: string,
    status: HttpStatus,
    body: NewDeviceGroupDTO,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .post(`/device-group/${url}`)
      .send({
        ...body,
      })
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const deleteDeviceGroup = async (
    url: string,
    status: HttpStatus,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .delete(`/device-group/${url}`)
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
