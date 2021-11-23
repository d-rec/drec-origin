import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import {
  MeasurementDTO,
  ReadDTO,
  Unit,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';
import { BASE_READ_SERVICE } from '../reads/const';
import { DeviceService } from '../device/device.service';
import { HttpService } from '@nestjs/axios';
import { Integrator } from '../../utils/enums';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { DeviceDTO } from '../device/dto';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import { EventBus } from '@nestjs/cqrs';
import { BigNumber } from 'ethers';

@Injectable()
export class IntegratorsService {
  private readonly logger = new Logger(IntegratorsService.name);

  constructor(
    private httpService: HttpService,
    private deviceService: DeviceService,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadsService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  // @Cron(CronExpression.EVERY_30_SECONDS)
  @Cron('0 30 01 * * *') // Every day at 01:30 - Server Time
  async handleBBOXcron(): Promise<void> {
    this.logger.debug('BBOX Cron called every 6 hours');

    const integrator: Integrator = Integrator.BBOX;
    const startDate = DateTime.now()
      .minus({ days: 4 })
      .toUTC()
      .toFormat('yyyy-MM-dd HH:mm:ss');
    const endDate = DateTime.now()
      .minus({ minute: 1 })
      .toUTC()
      .toFormat('yyyy-MM-dd HH:mm:ss');

    this.logger.debug(`Start date ${startDate} - End date ${endDate}`);

    const devices = await this.deviceService.findMultiple({
      where: {
        integrator,
      },
    });
    if (!devices?.length) {
      return;
    }
    const server = this.configService.get<string>('BBOX_SERVER') || '';
    const username = this.configService.get<string>('BBOX_USERNAME');
    const password = this.configService.get<string>('BBOX_PASSWORD');
    const loginForm = new FormData();
    loginForm.append('username', username);
    loginForm.append('password', password);

    const authToken = await this.loginBBOX(server, loginForm);

    await Promise.all(
      devices.map(async (device: DeviceDTO) =>
        this.storeBBOXenergyReads(
          server,
          authToken,
          device.externalId,
          startDate,
          endDate,
          device.organizationId,
        ),
      ),
    );
  }

  private loginBBOX(server: string, loginForm: FormData): Promise<string> {
    return this.httpService
      .post(`${server}/v1/auth/login`, loginForm, {
        headers: loginForm.getHeaders(),
      })
      .pipe(
        map(
          (response) =>
            response.data.message.login_successful.API_token as string,
        ),
        catchError((err) => throwError('Error while logging in to BBOX', err)),
      )
      .toPromise();
  }

  private getBBOXproductReadData(
    server: string,
    token: string,
    productId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      headers: { Authorization: `Token token=${token}` },
      params: {
        start: startDate,
        end: endDate,
        measurement: 'analysis',
        fields: 'energy_out',
      },
    };
    return this.httpService
      .get(`${server}/v1/products/${productId}/data`, requestConfig)
      .pipe(
        map((resp: any) => {
          return resp.data.data.energy_out;
        }),
        catchError((err) => throwError(err)),
      )
      .toPromise();
  }

  private async storeBBOXenergyReads(
    server: string,
    authToken: string,
    externalId: string,
    startDate: string,
    endDate: string,
    organizationId: number,
  ): Promise<void> {
    const energyData = await this.getBBOXproductReadData(
      server,
      authToken,
      externalId,
      startDate,
      endDate,
    );

    if (!energyData?.length) {
      this.logger.log(
        `BBOX: No Energy Data found for the interval ${startDate} to ${endDate}`,
      );
      return;
    }
    const reads: ReadDTO[] = energyData.map((energyValue: string[]) => {
      const read: ReadDTO = {
        timestamp: new Date(energyValue[1]),
        value: +energyValue[0],
      };
      return read;
    });
    const unit: Unit = Unit.kWh;

    await this.storeEnergy(externalId, reads, unit, organizationId);
  }

  private async storeEnergy(
    externalId: string,
    reads: ReadDTO[],
    unit: Unit,
    organizationId: number,
  ): Promise<void> {
    const measurements = new MeasurementDTO();
    measurements.reads = reads;
    measurements.unit = unit;

    this.logger.log(
      `BBOX: Storing measurements: ${JSON.stringify(measurements)}`,
    );
    await this.baseReadsService.store(externalId, measurements);

    for (const measurement of measurements.reads) {
      const startTime = DateTime.fromJSDate(measurement.timestamp)
        .minus({ minutes: 30 })
        .toJSDate();
      const endTime = DateTime.fromJSDate(measurement.timestamp).toJSDate();

      this.eventBus.publish(
        new GenerationReadingStoredEvent({
          deviceId: externalId,
          energyValue: BigNumber.from(measurement.value),
          fromTime: startTime,
          toTime: endTime,
          organizationId: organizationId.toString(),
        }),
      );
    }
    return;
  }
}
