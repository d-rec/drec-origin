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
import { before, after } from 'mocha';
import {
  FilterDTO,
  NewDeviceDTO,
  UpdateDeviceDTO,
} from '../src/pods/device/dto';
import { DeviceService } from '../src/pods/device/device.service';
import {
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../src/utils/enums';
import { DeviceStatus } from '@energyweb/origin-backend-core';

describe('Device tests', () => {
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

  it('should retrieve all devices', async () => {
    const loggedUser = {
      email: 'owner2@mailinator.com',
      password: 'test',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK, {});
    expect(devices).to.be.instanceOf(Array);
    expect(devices).to.have.length(4);
  });

  it('should retrieve device by id', async () => {
    const loggedUser = {
      email: 'owner2@mailinator.com',
      password: 'test',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK, {});
    const { body: device } = await requestDevice(
      devices[0].id,
      HttpStatus.OK,
      {},
    );
    expect(device.status).to.equal(DeviceStatus.Active);
  });

  it('should update a device', async () => {
    const loggedUser = {
      email: 'owner2@mailinator.com',
      password: 'test',
    };
    const partialDevice = {
      projectName: 'Device 2 - Update',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK, {});
    const { body: updatedDevice } = await updateDevice(
      devices[0].id,
      HttpStatus.OK,
      partialDevice,
    );
    expect(updatedDevice.status).to.equal(DeviceStatus.Submitted);
  });

  it('should create a device', async () => {
    const loggedUser = {
      email: 'owner2@mailinator.com',
      password: 'test',
    };
    const partialDevice: NewDeviceDTO = {
      drecID: 'DREC001',
      projectName: 'Device New',
      address: 'Somewhere far away',
      latitude: '34.921213',
      longitude: '135.717309',
      countryCode: 'DE',
      zipCode: 111111,
      fuelCode: 'ES100',
      deviceTypeCode: 'TC110',
      installationConfiguration: Installation.StandAlone,
      capacity: 1340,
      commissioningDate: '2012-07-01',
      gridInterconnection: true,
      offTaker: OffTaker.Commercial,
      sector: Sector.Agriculture,
      standardCompliance: StandardCompliance.IREC,
      yieldValue: 1000,
      generatorsIds: [],
      labels: '',
      impactStory: '',
      data: '',
      images: [],
    };
    await loginUser(loggedUser);
    const { body: updatedDevice } = await postDevice(
      '',
      HttpStatus.CREATED,
      partialDevice,
    );
    expect(updatedDevice.projectName).to.equal('Device New');
    expect(updatedDevice.status).to.equal(DeviceStatus.Active);
  });

  it('should return forbbidden when updating a device', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'test',
    };
    const partialDevice = {
      projectName: 'Device 2 - Update',
    };
    const { body: devices } = await requestDevice('', HttpStatus.OK, {});
    await loginUser(loggedUser);
    await updateDevice(devices[0].id, HttpStatus.FORBIDDEN, partialDevice);
  });

  it('should return forbbidden when creating a device', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: 'test',
    };
    const partialDevice: NewDeviceDTO = {
      drecID: 'DREC001',
      projectName: 'Device New',
      address: 'Somewhere far away',
      latitude: '34.921213',
      longitude: '135.717309',
      fuelCode: 'ES100',
      deviceTypeCode: 'TC110',
      installationConfiguration: Installation.StandAlone,
      capacity: 1340,
      countryCode: 'DE',
      zipCode: 111111,
      commissioningDate: '2012-07-01',
      gridInterconnection: true,
      offTaker: OffTaker.Commercial,
      sector: Sector.Agriculture,
      standardCompliance: StandardCompliance.IREC,
      yieldValue: 1000,
      generatorsIds: [],
      labels: '',
      impactStory: '',
      data: '',
      images: [],
    };
    await loginUser(loggedUser);
    await postDevice('', HttpStatus.FORBIDDEN, partialDevice);
  });

  const requestDevice = async (
    url: string,
    status: HttpStatus,
    filterDTO: Partial<FilterDTO>,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/device/${url}`)
      .query(filterDTO)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const updateDevice = async (
    url: string,
    status: HttpStatus,
    body: Partial<UpdateDeviceDTO>,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .patch(`/device/${url}`)
      .send({
        ...body,
      })
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);

  const postDevice = async (
    url: string,
    status: HttpStatus,
    body: NewDeviceDTO,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .post(`/device/${url}`)
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
