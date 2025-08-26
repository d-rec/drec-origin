import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { BigNumber } from 'ethers';
import FormData from 'form-data';
import { DateTime } from 'luxon';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GenerationReadingStoredEvent } from '../../events/GenerationReadingStored.event';
import {
  MeasurementDTO,
  ReadDTO,
  Unit
} from '../../types/reads';
import { ReadType } from '../../utils/enums/read-type.enum';
import { DeviceService } from '../device/device.service';
import { ReadsService } from '../reads/reads.service';

@Injectable()
export class IntegratorsService {
  private readonly logger = new Logger(IntegratorsService.name);

  constructor(
    private httpService: HttpService,
    private deviceService: DeviceService,
    private readsService: ReadsService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  public loginBBOX(server: string, loginForm: FormData): Promise<string> {
    this.logger.verbose(`With in loginBBOX`);
    return this.httpService
      .post(`${server}/v1/auth/login`, loginForm, {
        headers: loginForm.getHeaders(),
      })
      .pipe(
        map(
          (response: any) =>
            response.data.message.login_successful.API_token as string,
        ),
        catchError((err) => throwError('Error while logging in to BBOX', err)),
      )
      .toPromise();
  }

  public getBBOXProductReadData(
    server: string,
    token: string,
    productId: string,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    this.logger.verbose(`With in getBBOXProductReadData`);
    const requestConfig = {
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

  public async storeBBOXEnergyReads(
    server: string,
    authToken: string,
    externalId: string,
    startDate: string,
    endDate: string,
    organizationId: number,
  ): Promise<void> {
    this.logger.verbose(`With in storeBBOXEnergyReads`);
    const energyData = await this.getBBOXProductReadData(
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
      const startTime = DateTime.fromJSDate(new Date(energyValue[1]))
        .minus({ minutes: 30 })
        .toJSDate();
      const endTime = new Date(energyValue[1]);
      const read: ReadDTO = {
        startDate: startTime,
        endDate: endTime,
        value: parseFloat(energyValue[0]),
      };
      return read;
    });
    const unit: Unit = Unit.kWh;

    await this.storeEnergy(externalId, reads, unit, organizationId);
  }

  public async storeEnergy(
    externalId: string,
    reads: ReadDTO[],
    unit: Unit,
    organizationId: number,
  ): Promise<void> {
    this.logger.verbose(`With in storeEnergy`);
    const measurements: MeasurementDTO = {
      reads: reads,
      unit: unit,
      type: ReadType.Delta,
    };

    this.logger.log(
      `BBOX: Storing measurements: ${JSON.stringify(measurements)}`,
    );
    await this.readsService.store(externalId, measurements);

    for (const read of measurements.reads) {

      this.eventBus.publish(
        new GenerationReadingStoredEvent({
          deviceId: externalId,
          energyValue: BigNumber.from(read.value),
          fromTime: read.startDate,
          toTime: read.endDate,
          organizationId: organizationId.toString(),
        }),
      );
    }
    return;
  }
}
