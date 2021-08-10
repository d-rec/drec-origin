/* eslint-disable no-unused-expressions */
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@energyweb/origin-backend-utils';

import { bootstrapTestInstance } from './drec-api';
import { UserService } from '../src/pods/user/user.service';
import { DeviceService } from '../src/pods/device/device.service';
import { OrganizationService } from '../src/pods/organization';
import { seed } from './seed';
import { expect } from 'chai';
import { MeasurementDTO, ReadDTO, Unit } from '@energyweb/energy-api-influxdb';

describe('Reads tests', () => {
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
      databaseService,
      deviceService,
      configService,
    } = await bootstrapTestInstance());
    await databaseService.truncate('user', 'device', 'organization');

    await app.init();
    // clean influxdb
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

  it('stores smart meter readings to a device', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'test',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK);

    await requestDeviceCodeReads(devices[0]?.id, HttpStatus.CREATED);
    await expectReading(devices[0]?.id, 10000000);
  });

  it('validates and stores some meter readings to a device', async () => {
    const loggedUser = {
      email: 'admin2@mailinator.com',
      password: 'test',
    };
    await loginUser(loggedUser);
    const { body: devices } = await requestDevice('', HttpStatus.OK);

    const measurement1 = new MeasurementDTO();
    const measurement2 = new MeasurementDTO();

    measurement1.unit = Unit.kWh;
    measurement2.unit = Unit.kWh;
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 10);

    const date1 = new Date();
    date1.setHours(date1.getHours() - 7);

    const date2 = new Date();
    date2.setHours(date2.getHours() - 1.4);

    const date3 = new Date();
    date3.setHours(date3.getHours() - 1);
    measurement1.reads = [{ timestamp: date1, value: 120000 }];
    measurement2.reads = [
      { timestamp: date2, value: 16000 },
      { timestamp: date3, value: 9999999999 },
    ];

    await requestDeviceMultipleCodeReads(
      devices[1]?.id,
      HttpStatus.CREATED,
      measurement1,
    );
    await requestDeviceMultipleCodeReads(
      devices[1]?.id,
      HttpStatus.CREATED,
      measurement2,
    );
    const { body: retrievedReads } = await requestValidatedReadings(
      devices[1]?.id,
      startDate,
      new Date(),
    );
    expect(retrievedReads).to.be.instanceOf(Array);
    const filteredRead = retrievedReads.find(
      (read: ReadDTO) => read.value === measurement2.reads[1].value,
    );
    expect(filteredRead).to.eq(undefined);
  });

  const expectReading = async (
    meterId: string,
    expected: number,
  ): Promise<void> => {
    const { body } = await request(app.getHttpServer())
      .get(
        `/meter-reads/${meterId}?limit=100&offset=0&start=${new Date(
          0,
        ).toISOString()}&end=${new Date().toISOString()}`,
      )
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(HttpStatus.OK);

    expect(body[0].value).to.be.eql(expected);
  };

  const requestValidatedReadings = async (
    meterId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any> =>
    await request(app.getHttpServer())
      .get(
        `/meter-reads/${meterId}?limit=100&offset=0&start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
      )
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(HttpStatus.OK);

  const requestDeviceCodeReads = async (
    meterId: string,
    status: HttpStatus,
    value = 10000000,
    unit = 'Wh',
  ): Promise<any> => {
    await request(app.getHttpServer())
      .post(`/meter-reads/${meterId}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .send({
        reads: [
          {
            timestamp: '2020-01-01T00:00:00Z',
            value,
          },
        ],
        unit,
      })
      .expect(status);
  };

  const requestDeviceMultipleCodeReads = async (
    meterId: string,
    status: HttpStatus,
    measurement: MeasurementDTO,
  ): Promise<any> => {
    return await request(app.getHttpServer())
      .post(`/meter-reads/${meterId}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .send(measurement)
      .expect(status);
  };

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

  const requestDevice = async (url: string, status: HttpStatus): Promise<any> =>
    await request(app.getHttpServer())
      .get(`/device/${url}`)
      .set('Authorization', `Bearer ${currentAccessToken}`)
      .expect(status);
});
