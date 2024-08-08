/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  FilterDTO,
  NewDeviceDTO,
  UpdateDeviceDTO,
} from '../src/pods/device/dto';
import { DeviceService } from '../src/pods/device/device.service';
import {
  DeviceOrderBy,
  DevicetypeCode,
  FuelCode,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../src/utils/enums';
import { DeviceStatus } from '@energyweb/origin-backend-core';
import { DeviceGroupByDTO } from '../src/pods/device/dto/device-group-by.dto';

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

  it('should retrieve all devices', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: '******123',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK, {});
    expect(devices).to.be.instanceOf(Array);
    expect(devices).to.have.length(4);
  });

  it('should retrieve device by id', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: '******123',
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
      email: 'admin2@mailinator.com',
      password: '******123',
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
      password: '******123',
    };
    const partialDevice: NewDeviceDTO = {
      externalId: 'DREC001',
      projectName: 'Device New',
      address: 'Somewhere far away',
      latitude: '34.921213',
      longitude: '135.717309',
      countryCode: 'DE',
      fuelCode: FuelCode.ES100,
      deviceTypeCode: DevicetypeCode.TC110,
      capacity: 1340,
      commissioningDate: '2012-07-01',
      gridInterconnection: true,
      offTaker: OffTaker.Commercial,
      yieldValue: 1000,
      impactStory: '',
      images: [],
      energyStorage: true,
      energyStorageCapacity: 900,
      qualityLabels: '',
      version: '1.0',
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
      email: 'admin2@mailinator.com',
      password: '******123',
    };
    const partialDevice = {
      projectName: 'Device 2 - Update',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK, {});
    const loggedUser2 = {
      email: 'buyer2@mailinator.com',
      password: '******123',
    };
    await loginUser(loggedUser2);
    await updateDevice(devices[0].id, HttpStatus.FORBIDDEN, partialDevice);
  });

  it('should return forbbidden when creating a device', async () => {
    const loggedUser = {
      email: 'buyer2@mailinator.com',
      password: '******123',
    };
    const partialDevice: NewDeviceDTO = {
      externalId: 'DREC001',
      projectName: 'Device New',
      address: 'Somewhere far away',
      latitude: '34.921213',
      longitude: '135.717309',
      fuelCode: FuelCode.ES100,
      deviceTypeCode: DevicetypeCode.TC110,
      capacity: 1340,
      countryCode: 'DE',
      commissioningDate: '2012-07-01',
      gridInterconnection: true,
      offTaker: OffTaker.Commercial,
      yieldValue: 1000,
      impactStory: '',
      images: [],
      energyStorage: true,
      energyStorageCapacity: 900,
      qualityLabels: '',
      version: '1.0',
    };
    await loginUser(loggedUser);
    await postDevice('', HttpStatus.FORBIDDEN, partialDevice);
  });

  it('should return grouped devices', async () => {
    const loggedUser = {
      email: 'owner2@mailinator.com',
      password: '******123',
    };
    await loginUser(loggedUser);
    const orderFilter: Partial<DeviceGroupByDTO> = {
      orderBy: [DeviceOrderBy.Country, DeviceOrderBy.OffTaker],
    };
    const { body: deviceGroups } = await requestUngrouppedDevice(
      HttpStatus.OK,
      orderFilter,
    );

    expect(deviceGroups).to.be.instanceOf(Array);
    expect(deviceGroups[0].devices[0].offTaker).to.eq(OffTaker.HealthFacility);
    expect(deviceGroups[0].devices[0].sector).to.eq(Sector.Agriculture);
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

  const requestUngrouppedDevice = async (
    status: HttpStatus,
    orderFilterDto: Partial<DeviceGroupByDTO>,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/device/ungrouped`)
      .query(orderFilterDto)
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
