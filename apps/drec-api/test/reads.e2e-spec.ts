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

    measurement1.unit = Unit.Wh;
    measurement2.unit = Unit.Wh;
    measurement1.reads = [{ timestamp: new Date(), value: 120000 }];
    measurement2.reads = [
      { timestamp: new Date(), value: 15000 },
      { timestamp: new Date(), value: 16000 },
      { timestamp: new Date(), value: 9999999999 },
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
    );
    expect(retrievedReads).to.be.instanceOf(Array);
    expect(retrievedReads).to.have.length(3);
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

  const requestValidatedReadings = async (meterId: string): Promise<any> =>
    await request(app.getHttpServer())
      .get(
        `/meter-reads/${meterId}?limit=100&offset=0&start=${new Date(
          0,
        ).toISOString()}&end=${new Date().toISOString()}`,
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
