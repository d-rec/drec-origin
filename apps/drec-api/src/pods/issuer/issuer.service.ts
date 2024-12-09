import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  IGetAllCertificatesOptions,
  IIssueCommandParams,
} from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../utils/types';
import { DateTime } from 'luxon';
import {
  FilterDTO,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';
import { v4 as uuid } from 'uuid';

import { HttpService } from '@nestjs/axios';

import { DeviceService } from '../device/device.service';
import { BASE_READ_SERVICE } from '../reads/const';
import { OrganizationService } from '../organization/organization.service';
import { DeviceGroupService } from '../device-group/device-group.service';
import {
  IDevice,
  BuyerReservationCertificateGenerationFrequency,
} from '../../models';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity';
import { EndReservationdateDTO } from '../device-group/dto';
import {
  CertificateType,
  ReadType,
  SingleDeviceIssuanceStatus,
  StandardCompliance,
} from '../../utils/enums';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from '../device-group/check_certificate_issue_date_log_for_device_group.entity';
import { HistoryDeviceGroupNextIssueCertificate } from '../device-group/history_next_issuance_date_log.entity';
import { ReadsService } from '../reads/reads.service';
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { Device } from '../device';
import { OffChainCertificateService } from '@energyweb/origin-247-certificate';
import { HistoryNextInssuanceStatus } from '../../utils/enums/history_next_issuance.enum';
import { DeviceLateongoingIssueCertificateEntity } from '../device/device_lateongoing_certificate.entity';
@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);

  constructor(
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    private readService: ReadsService,

    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadsService,
    private httpService: HttpService,
    private readonly offChainCertificateService: OffChainCertificateService<ICertificateMetadata>,
  ) {}

  hitTheCronFromIssuerAPIOngoing(): void {
    this.logger.verbose(`With in hitTheCronFromIssuerAPIOngoing`);

    this.httpService
      .get(`${process.env.REACT_APP_BACKEND_URL}/api/drec-issuer/ongoing`)
      .subscribe();
  }

  hitTheCronFromIssuerAPIHistory(): void {
    this.logger.verbose(`With in hitTheCronFromIssuerAPIHistory`);

    this.httpService
      .get(`${process.env.REACT_APP_BACKEND_URL}/api/drec-issuer/history`)
      .subscribe();
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron(): Promise<void> {
    this.logger.debug('Ongoing Cycle');
    this.logger.debug(
      'Called every 10 minutes to check for Issuance of certificates',
    );

    const groupsRequestAll =
      await this.groupService.getAllNextrequestCertificate();
    await Promise.all(
      groupsRequestAll.map(
        async (groupRequest: DeviceGroupNextIssueCertificate) => {
          const group = await this.groupService.findOne({
            id: groupRequest.groupId,
          });
          if (!group) {
            this.logger.error('ongoing group is missing');
            return; //if group is missing
          }
          if (
            group.leftoverReadsByCountryCode === null ||
            group.leftoverReadsByCountryCode === undefined ||
            group.leftoverReadsByCountryCode === ''
          ) {
            group.leftoverReadsByCountryCode = {};
          }
          if (typeof group.leftoverReadsByCountryCode === 'string') {
            group.leftoverReadsByCountryCode = JSON.parse(
              group.leftoverReadsByCountryCode,
            );
          }

          const countryDeviceGroup = await this.deviceService.newFindForGroup(
            group.id,
          );

          const organization = await this.organizationService.findOne(
            group.organizationId,
          );
          group.organization = {
            name: organization.name,
            blockchainAccountAddress: organization.blockchainAccountAddress,
          };

          const startDate = DateTime.fromISO(groupRequest.start_date).toUTC();
          const endDate = DateTime.fromISO(groupRequest.end_date).toUTC();
          const start_date = endDate.toString();

          let hours = 1;
          const frequency = group.frequency.toLowerCase();
          if (
            frequency === BuyerReservationCertificateGenerationFrequency.daily
          ) {
            hours = 1 * 24;
          } else if (
            frequency === BuyerReservationCertificateGenerationFrequency.monthly
          ) {
            hours = 30 * 24;
          } else if (
            frequency === BuyerReservationCertificateGenerationFrequency.weekly
          ) {
            hours = 7 * 24;
          } else if (
            frequency ===
            BuyerReservationCertificateGenerationFrequency.quarterly
          ) {
            hours = 91 * 24;
          }
          const end_date = new Date(
            new Date(new Date(endDate.toString())).getTime() + hours * 3.6e6,
          ).toISOString();

          let newEndDate = '';
          let skipUpdatingNextIssuanceLogTable = false;
          if (
            new Date(endDate.toString()).getTime() ===
            group.reservationEndDate.getTime()
          ) {
            skipUpdatingNextIssuanceLogTable = true;
            const endDto = new EndReservationdateDTO();
            endDto.endresavationdate = new Date(group.reservationEndDate);
            await this.groupService.endReservationGroup(
              group.id,
              group.organizationId,
              endDto,
              group,
              groupRequest,
            );
          }
          if (!skipUpdatingNextIssuanceLogTable) {
            if (
              new Date(end_date).getTime() < group.reservationEndDate.getTime()
            ) {
              newEndDate = end_date;
            } else {
              newEndDate = group.reservationEndDate.toISOString();
            }
            const allDevicesOfGroup: Device[] =
              await this.deviceService.findForGroup(group.id);

            try {
              //https://stackoverflow.com/a/10124053
              allDevicesOfGroup.sort(function (a, b) {
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return (
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
                );
              });

              const deviceOnBoardedWhichIsInBetweenNextIssuance: Device =
                allDevicesOfGroup.find((ele) => {
                  //returns first find which is minimum and between next frequency
                  if (
                    new Date(ele.createdAt).getTime() >
                      new Date(start_date).getTime() &&
                    new Date(ele.createdAt).getTime() <
                      new Date(newEndDate).getTime()
                  ) {
                    return true;
                  }
                });
              if (deviceOnBoardedWhichIsInBetweenNextIssuance) {
                newEndDate = new Date(
                  deviceOnBoardedWhichIsInBetweenNextIssuance.createdAt,
                ).toISOString();
              }
            } catch (e) {
              this.logger.error(
                'exception caught in inbetween device onboarding checking for createdAt',
              );
              this.logger.error(e);
            }
            await this.groupService.updateCertificateIssueDate(
              groupRequest.id,
              start_date,
              newEndDate,
            );
          }

          this.logger.debug(`Start date ${startDate} - End date ${endDate}`);
          this.logger.error('ongoing countryDeviceGroup is missing');
          // if (Object.keys(countryDeviceGroup).length === 0) {
          const groupDevices = await this.deviceService.findForGroup(group.id);

          await Promise.all(
            groupDevices.map(async (device: IDevice) => {
              if (
                device.meterReadtype === null &&
                new Date(device.createdAt).getTime() <=
                  new Date(groupRequest.start_date).getTime()
              ) {
                await this.addLateOngoingDeviceCertificateCycle(
                  group.id,
                  device.externalId,
                  startDate,
                  endDate,
                );
              }
            }),
          );

          for (const key in countryDeviceGroup) {
            //deep clone to avoid duplicates
            const newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));
            newGroup.devices = countryDeviceGroup[key];
            await this.newIssueCertificateForGroup(
              newGroup,
              groupRequest,
              startDate,
              endDate,
              key,
            );
          }

          /*  this is use for generate certificate if frequency is weekly,monthly  
           if (endDate.diff(startDate, ['days']).days <= 1) {
             for (let key in countryDeviceGroup) {
               //deep clone to avoid duplicates
               let newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));
               newGroup.devices = countryDeviceGroup[key];
               // console.log("218line", startDate)
               // console.log("20619line", endDate)
               this.newIssueCertificateForGroup(newGroup, groupRequest, startDate, endDate, key);
             }

           }
           else {
             console.log("224line,monthlytestr")
             let startDateCopy = DateTime.fromMillis(startDate.toMillis());
             let endDateCopy = DateTime.fromMillis(endDate.toMillis());
             const arrayofStartAndEndTimeDividedDifferenceBetweenAsOneDay: Array<{ startDate: DateTime, endDate: DateTime }> = [];
             let currentDate = startDateCopy;
             while (currentDate < endDateCopy) {
               const nextDay = currentDate.plus({ days: 1 });
               const nextEndDate = (endDateCopy < nextDay) ? endDateCopy : nextDay;
               arrayofStartAndEndTimeDividedDifferenceBetweenAsOneDay.push({
                 startDate: currentDate,
                 endDate: nextEndDate
               });
               currentDate = nextDay;
             }
             for (let key in countryDeviceGroup) {
               //deep clone to avoid duplicates
               let newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));
               newGroup.devices = countryDeviceGroup[key];
               arrayofStartAndEndTimeDividedDifferenceBetweenAsOneDay.forEach((ele, index) => {
                 this.newIssueCertificateForGroup(JSON.parse(JSON.stringify(newGroup)), JSON.parse(JSON.stringify(groupRequest)), ele.startDate, ele.endDate, key, index);
               })
             }
           }*/
        },
      ),
    );
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCronForHistoricalIssuance(): Promise<void> {
    this.logger.debug('History Cycle');
    this.logger.verbose(`With in handleCronForHistoricalIssuance`);
    const historyDeviceRequestAll =
      await this.groupService.getNextHistoryissuanceDevicelog();

    await Promise.all(
      historyDeviceRequestAll.map(
        async (
          historyDevice: HistoryDeviceGroupNextIssueCertificate,
          historyDeviceRequestIndex: number,
        ) => {
          const group = await this.groupService.findOne({
            id: historyDevice.groupId,
          });
          if (!group) {
            this.logger.error(`history group is missing`);
            return; //if group is missing
          }
          const organization = await this.organizationService.findOne(
            group.organizationId,
          );
          group.organization = {
            name: organization.name,
            blockchainAccountAddress: organization.blockchainAccountAddress,
          };
          const device = await this.deviceService.findReads(
            historyDevice.device_externalid,
          );
          const historyRead =
            await this.readService.getCheckHistoryCertificateIssueDateLogForDevice(
              historyDevice.device_externalid,
              historyDevice.reservationStartDate,
              historyDevice.reservationEndDate,
            );

          if (historyRead?.length > 0) {
            await Promise.all(
              historyRead.map(
                async (historyDeviceRead: HistoryIntermediate_MeterRead) => {
                  this.newHistoryIssueCertificateForDevice(
                    group,
                    historyDeviceRead,
                    device,
                  );
                },
              ),
            );
            let totalHistoryReadForSingleDevices = 0;
            historyRead.forEach(
              (historyDeviceRead: HistoryIntermediate_MeterRead) => {
                if (!group.buyerAddress || !group.buyerId) {
                  return;
                }
                // minimum value of certificate should be 1 Kw =1000W.
                if (historyDeviceRead.readsvalue < 1000) {
                  return;
                }
                totalHistoryReadForSingleDevices =
                  totalHistoryReadForSingleDevices +
                  historyDeviceRead.readsvalue;
              },
            );
            const totalReadValueMegaWattHour =
              totalHistoryReadForSingleDevices / 10 ** 6;

            if (totalReadValueMegaWattHour != 0) {
              setTimeout(
                () => {
                  this.groupService.updateTotalReadingRequestedForCertificateIssuance(
                    group.id,
                    group.organizationId,
                    totalReadValueMegaWattHour,
                  );
                },
                1000 * (historyDeviceRequestIndex + 1),
              );
            }
            await this.groupService.updateHistoryCertificateIssueDate(
              historyDevice.id,
              HistoryNextInssuanceStatus.Completed,
            );
            if (group.reservationExpiryDate !== null) {
              if (
                group.reservationExpiryDate.getTime() <=
                  group.reservationEndDate.getTime() ||
                group.reservationExpiryDate.getTime() <= new Date().getTime()
              ) {
                await this.deviceService.removeFromGroup(device.id, group.id);
              }
            } else {
              if (
                group.reservationEndDate.getTime() <=
                new Date(device.createdAt).getTime()
              ) {
                await this.deviceService.removeFromGroup(device.id, group.id);
              }
            }
          }
          await this.groupService.updateHistoryCertificateIssueDate(
            historyDevice.id,
            HistoryNextInssuanceStatus.Completed,
          );
          if (group.reservationExpiryDate !== null) {
            if (
              group.reservationExpiryDate.getTime() <=
                group.reservationEndDate.getTime() ||
              group.reservationExpiryDate.getTime() <= new Date().getTime()
            ) {
              await this.deviceService.removeFromGroup(device.id, group.id);
            }
          } else {
            if (
              group.reservationEndDate.getTime() <=
              new Date(device.createdAt).getTime()
            ) {
              await this.deviceService.removeFromGroup(device.id, group.id);
            }
          }

          const count =
            await this.groupService.countGroupIdHistoryIssuanceDeviceLog(
              historyDevice.groupId,
            );
          const checkNextOngoingIssuance =
            await this.groupService.getGroupiCertificateIssueDate({
              groupId: group.id,
            });

          if (count === 0 && !checkNextOngoingIssuance) {
            if (group.reservationExpiryDate !== null) {
              if (
                group.reservationExpiryDate.getTime() <=
                  group.reservationEndDate.getTime() ||
                group.reservationExpiryDate.getTime() <= new Date().getTime()
              ) {
                await this.groupService.deactiveReaservation(group);
              }
            } else {
              await this.groupService.deactiveReaservation(group);
            }
          }
        },
      ),
    );
  }

  public async addLateOngoingDeviceCertificateCycle(
    groupId: number,
    deviceExternalId: string,
    late_start_date: Date | string | DateTime,
    late_end_date: Date | string | DateTime,
  ): Promise<DeviceLateongoingIssueCertificateEntity> {
    const lateDeviceCertificateLogDTO =
      new DeviceLateongoingIssueCertificateEntity();
    (lateDeviceCertificateLogDTO.device_externalid = deviceExternalId),
      (lateDeviceCertificateLogDTO.groupId = groupId),
      (lateDeviceCertificateLogDTO.late_start_date =
        late_start_date.toString()),
      (lateDeviceCertificateLogDTO.late_end_date = late_end_date.toString());
    return await this.deviceService.addLateCertificateIssueDateLogForDevice(
      lateDeviceCertificateLogDTO,
    );
  }

  public async newIssueCertificateForGroup(
    group: DeviceGroup,
    groupRequest: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string,
  ): Promise<void> {
    this.logger.verbose(`With in newIssueCertificateForGroup`);

    if (!group?.devices?.length) {
      this.logger.debug('Line No: 463');
      return;
    }
    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      this.logger.error(
        `No organization found with code ${group.organizationId}`,
      );
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }
    const groupReads: number[] = [];
    const allDevicesCompleteReadsBetweenTimeRange: Array<
      Array<{ timestamp: Date; value: number }>
    > = [];
    const filteredDevicesIndexesListIfMeterReadsNotAvailable: Array<number> =
      [];
    /*Get all devices meter reads between time range */
    /*https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop refer to answer why map and async works */
    await Promise.all(
      group.devices.map(async (device: IDevice, index: number) => {
        /*
         day: 24 hours entries if hourly data  is sent , implies max entries 24 for one device
         30 days issuance : max entries 30*24 = 720
        quarterly: issuance : max entries  3 months: 31*3*24 = 2232
        so limit 5000 is kept to be on safer side
         */

        const readsFilter: FilterDTO = {
          offset: 0,
          limit: 5000,
          start: startDate.toString(),
          end: endDate.toString(),
        };

        let allReadsForDeviceBetweenTimeRange: Array<{
          timestamp: Date;
          value: number;
        }> = await this.getDeviceFullReadsWithTimestampAndValueAsArray(
          device.externalId,
          readsFilter,
        );
        if (allReadsForDeviceBetweenTimeRange != undefined) {
          if (
            device.meterReadtype === 'Delta' ||
            allReadsForDeviceBetweenTimeRange.length > 0
          ) {
            const FirstDeltaRead =
              await this.readService.getDeltaMeterReadsFirstEntryOfDevice(
                device.externalId,
              );
            allReadsForDeviceBetweenTimeRange =
              allReadsForDeviceBetweenTimeRange.filter(
                (v) =>
                  !FirstDeltaRead.some(
                    (e) => e.readsEndDate.getTime() === v.timestamp.getTime(),
                  ),
              );
          }

          const certifiedDevices =
            await this.deviceService.getCheckCertificateIssueDateLogForDevice(
              device.externalId,
              new Date(startDate.toString()),
              new Date(endDate.toString()),
            );
          if (
            certifiedDevices.length > 0 &&
            allReadsForDeviceBetweenTimeRange.length > 0
          ) {
            allReadsForDeviceBetweenTimeRange =
              allReadsForDeviceBetweenTimeRange.filter((ele) => {
                let readingInBetween = false;
                certifiedDevices.forEach((certifiedDevice) => {
                  if (
                    ele.timestamp.getTime() >=
                      new Date(
                        certifiedDevice.certificate_issuance_startdate,
                      ).getTime() &&
                    ele.timestamp.getTime() <=
                      new Date(
                        certifiedDevice.certificate_issuance_enddate,
                      ).getTime()
                  ) {
                    readingInBetween = true;
                  }
                });
                if (readingInBetween) {
                  return false;
                } else {
                  return true;
                }
              });
          }
          allDevicesCompleteReadsBetweenTimeRange[index] =
            allReadsForDeviceBetweenTimeRange;
          const deviceReadValue = allReadsForDeviceBetweenTimeRange.reduce(
            (accumulator, currentValue) => accumulator + currentValue.value,
            0,
          );
          if (deviceReadValue === 0) {
            filteredDevicesIndexesListIfMeterReadsNotAvailable.push(index);
            const isLateOngoingCycle =
              await this.deviceService.findDeviceLateCycleOfDateRange(
                group.id,
                device.externalId,
                startDate,
                endDate,
              );

            if (!isLateOngoingCycle) {
              await this.addLateOngoingDeviceCertificateCycle(
                group.id,
                device.externalId,
                startDate,
                endDate,
              );
            }
          }
          if (deviceReadValue !== 0) {
            const lastRead = await this.readService.latestRead(
              device.externalId,
              device.createdAt,
            );
            if (
              new Date(lastRead[0].timestamp).getTime() <
              new Date(endDate.toString()).getTime()
            ) {
              const newStartDate = new Date(lastRead[0].timestamp);
              newStartDate.setTime(newStartDate.getTime() + 1);
              const isLateOngoingCycle =
                await this.deviceService.findDeviceLateCycleOfDateRange(
                  group.id,
                  device.externalId,
                  DateTime.fromISO(newStartDate.toISOString()).toUTC(),
                  endDate,
                );

              if (!isLateOngoingCycle) {
                await this.addLateOngoingDeviceCertificateCycle(
                  group.id,
                  device.externalId,
                  new Date(newStartDate).toISOString(),
                  endDate,
                );
              }
              this.logger.error('late ongoing read is missing');
            }
          }
          groupReads[index] = deviceReadValue;
        }
      }),
    );

    if (filteredDevicesIndexesListIfMeterReadsNotAvailable.length > 0) {
      filteredDevicesIndexesListIfMeterReadsNotAvailable.forEach((index) => {
        group.devices.splice(index, 1);
        allDevicesCompleteReadsBetweenTimeRange.splice(index, 1);
        groupReads.splice(index, 1);
      });
    }

    if (group.devices.length === 0) {
      //after filtering if devices are not there then do not continue further
      return;
    }
    const totalReadValue = groupReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    );

    if (!totalReadValue) {
      return;
    }
    const totalReadValueKw = await this.handleLeftoverReadsByCountryCode(
      group,
      totalReadValue,
      countryCodeKey,
    );
    if (!totalReadValueKw) {
      return;
    }
    const issueTotalReadValue = totalReadValueKw * 10 ** 3; // Issue certificate in watts

    if (!group.buyerAddress || !group.buyerId) {
      return;
    }
    const allPreviousReadingsOfDevices: Array<{
      timestamp: Date;
      value: number;
    }> = [];
    const certificateTransactionUID = uuid();
    await Promise.all(
      group.devices.map(async (device: IDevice, index) => {
        console.log('came inside previous readings check');
        let previousReading: Array<{ timestamp: Date; value: number }> = [];
        if (allDevicesCompleteReadsBetweenTimeRange[index].length > 0) {
          const endTimestampToCheck = new Date(
            allDevicesCompleteReadsBetweenTimeRange[
              index
            ][0].timestamp.getTime() - 1000,
          );
          const startTimeToCheck = device.createdAt;
          try {
            previousReading =
              await this.readService.findLastReadForMeterWithinRange(
                device.externalId,
                new Date(startTimeToCheck),
                endTimestampToCheck,
              );

            if (previousReading.length == 0) {
              if (device.meterReadtype === ReadType.Delta) {
                previousReading = [
                  { timestamp: new Date(device.createdAt), value: 0 },
                ];
              } else if (device.meterReadtype === ReadType.ReadMeter) {
                try {
                  const aggregateReadings =
                    await this.readService.getAggregateMeterReadsFirstEntryOfDevice(
                      device.externalId,
                    );
                  if (aggregateReadings.length > 0) {
                    previousReading = [
                      {
                        timestamp: new Date(aggregateReadings[0].datetime),
                        value: 0,
                      },
                    ];
                  }
                } catch (e) {
                  this.logger.error(`error in getting aggregate read ${e}`);
                }
              }
            }
            //change this to when was initial reading came for aggregate or else if delta then its the createdAt
            if (previousReading.length > 0) {
              allPreviousReadingsOfDevices[index] = previousReading[0];
            }
          } catch (e) {
            this.logger.error(`error in getting aggregate read ${e}`);
          }
        }
        const deviceReadValue = allDevicesCompleteReadsBetweenTimeRange[
          index
        ].reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );

        const deviceCertificateLogDTO =
          new CheckCertificateIssueDateLogForDeviceEntity();
        (deviceCertificateLogDTO.externalId = device.externalId),
          (deviceCertificateLogDTO.certificate_issuance_startdate =
            previousReading.length > 0
              ? new Date(
                  new Date(previousReading[0].timestamp).getTime() + 1000,
                )
              : new Date(startDate.toString())),
          (deviceCertificateLogDTO.certificate_issuance_enddate =
            allDevicesCompleteReadsBetweenTimeRange[index][
              allDevicesCompleteReadsBetweenTimeRange[index].length - 1
            ].timestamp), // new Date(endDate.toString()),
          (deviceCertificateLogDTO.status =
            SingleDeviceIssuanceStatus.Requested),
          (deviceCertificateLogDTO.readvalue_watthour = deviceReadValue);
        (deviceCertificateLogDTO.groupId = group.id),
          (deviceCertificateLogDTO.certificateTransactionUID =
            certificateTransactionUID.toString());
        (deviceCertificateLogDTO.ongoing_start_date = groupRequest.start_date),
          (deviceCertificateLogDTO.ongoing_end_date = groupRequest.end_date);
        await this.deviceService.addCertificateIssueDateLogForDevice(
          deviceCertificateLogDTO,
        );
      }),
    );
    //find the minimum of all previous reading dates of devices  and use it as start date
    let minimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z');
    const checkMinimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z'); // eslint-disable-line @typescript-eslint/no-unused-vars
    if (allPreviousReadingsOfDevices.length == 1) {
      minimumStartDate = new Date(
        new Date(allPreviousReadingsOfDevices[0].timestamp).getTime() + 1000,
      );
    }
    if (allPreviousReadingsOfDevices.length > 1) {
      allPreviousReadingsOfDevices.sort(function (a, b) {
        return Number(a.timestamp) - Number(b.timestamp);
      });
      minimumStartDate = new Date(
        new Date(allPreviousReadingsOfDevices[0].timestamp).getTime() + 1000,
      );
    }
    let maximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z');
    const checkMaximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z'); // eslint-disable-line @typescript-eslint/no-unused-vars

    if (allDevicesCompleteReadsBetweenTimeRange.length == 1) {
      maximumEndDate =
        allDevicesCompleteReadsBetweenTimeRange[0][
          allDevicesCompleteReadsBetweenTimeRange[0].length - 1
        ].timestamp;
    } else if (allDevicesCompleteReadsBetweenTimeRange.length > 1) {
      allDevicesCompleteReadsBetweenTimeRange.forEach((ele) => {
        if (ele.length > 0) {
          //if there are readings take last index reading as its the earliest date
          if (
            ele[ele.length - 1].timestamp.getTime() > maximumEndDate.getTime()
          ) {
            maximumEndDate = ele[ele.length - 1].timestamp;
          }
        }
      });
    }

    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: issueTotalReadValue.toString(),
      fromTime: minimumStartDate, //new Date(startDate.toString()),
      toTime: maximumEndDate, //new Date(endDate.toString()),
      toAddress: group.buyerAddress,
      userId: group.buyerAddress,
      metadata: {
        version: 'v1.0',
        buyerReservationId: group.devicegroup_uid,
        isStandardIssuanceRequested: StandardCompliance.IREC,
        type: CertificateType.REC,
        deviceIds: group.devices.map((device: IDevice) => device.externalId),
        //deviceGroup,
        groupId: group.id?.toString() || null,
        certificateTransactionUID: certificateTransactionUID.toString(),
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    const totalReadValueMegaWattHour = totalReadValueKw / 10 ** 3;
    this.groupService.updateTotalReadingRequestedForCertificateIssuance(
      group.id,
      group.organizationId,
      totalReadValueMegaWattHour,
    );
    if (
      group.authorityToExceed === false &&
      group.targetVolumeCertificateGenerationRequestedInMegaWattHour +
        totalReadValueMegaWattHour >=
        group.targetVolumeInMegaWattHour
    ) {
      this.groupService.endReservation(group.id, group, groupRequest);
    }
    const deviceGroupCertificateLogDTO =
      new CheckCertificateIssueDateLogForDeviceGroupEntity();
    (deviceGroupCertificateLogDTO.groupid = group.id?.toString()),
      (deviceGroupCertificateLogDTO.certificate_issuance_startdate =
        minimumStartDate), //new Date(startDate.toString()),
      (deviceGroupCertificateLogDTO.certificate_issuance_enddate =
        maximumEndDate), //new Date(endDate.toString()),
      (deviceGroupCertificateLogDTO.status =
        SingleDeviceIssuanceStatus.Requested),
      (deviceGroupCertificateLogDTO.readvalue_watthour = issueTotalReadValue),
      (deviceGroupCertificateLogDTO.certificate_payload = issuance),
      (deviceGroupCertificateLogDTO.countryCode = countryCodeKey),
      (deviceGroupCertificateLogDTO.certificateTransactionUID =
        certificateTransactionUID.toString());
    await this.groupService.addCertificateIssueDateLogForDeviceGroup(
      deviceGroupCertificateLogDTO,
    );
    this.issueCertificate(issuance);
    return;
  }

  public async newHistoryIssueCertificateForDevice(
    group: DeviceGroup,
    deviceHistoryRequest: HistoryIntermediate_MeterRead,
    device: IDevice,
  ): Promise<void> {
    if (!group.buyerAddress || !group.buyerId) {
      return;
    }
    // minimum value of certificate should be 1 Kw =1000W.
    if (deviceHistoryRequest.readsvalue < 1000) {
      return;
    }
    const certificateTransactionUID = uuid();
    const deviceCertificateLogDTO =
      new CheckCertificateIssueDateLogForDeviceEntity();
    (deviceCertificateLogDTO.externalId = device.externalId),
      (deviceCertificateLogDTO.certificate_issuance_startdate = new Date(
        deviceHistoryRequest.readsStartDate.toString(),
      )),
      (deviceCertificateLogDTO.certificate_issuance_enddate = new Date(
        deviceHistoryRequest.readsEndDate.toString(),
      )),
      (deviceCertificateLogDTO.status = SingleDeviceIssuanceStatus.Requested),
      (deviceCertificateLogDTO.readvalue_watthour =
        deviceHistoryRequest.readsvalue);
    deviceCertificateLogDTO.groupId = group.id;
    deviceCertificateLogDTO.certificateTransactionUID =
      certificateTransactionUID.toString();
    await this.deviceService.addCertificateIssueDateLogForDevice(
      deviceCertificateLogDTO,
    );
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: deviceHistoryRequest.readsvalue.toString(),
      fromTime: new Date(deviceHistoryRequest.readsStartDate.toString()),
      toTime: new Date(deviceHistoryRequest.readsEndDate.toString()),
      toAddress: group.buyerAddress,
      userId: group.buyerAddress,

      metadata: {
        version: 'v1.0',
        buyerReservationId: group.devicegroup_uid,
        isStandardIssuanceRequested: StandardCompliance.IREC,
        type: CertificateType.REC,
        deviceIds: [device.externalId],
        //deviceGroup,
        certificateTransactionUID: certificateTransactionUID.toString(),
        groupId: group.id?.toString() || null,
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    const deviceGroupCertificateLogDTO =
      new CheckCertificateIssueDateLogForDeviceGroupEntity();
    (deviceGroupCertificateLogDTO.groupid = group.id?.toString()),
      (deviceGroupCertificateLogDTO.certificate_issuance_startdate = new Date(
        deviceHistoryRequest.readsStartDate.toString(),
      )), //new Date(startDate.toString()),
      (deviceGroupCertificateLogDTO.certificate_issuance_enddate = new Date(
        deviceHistoryRequest.readsEndDate.toString(),
      )), //new Date(endDate.toString()),
      (deviceGroupCertificateLogDTO.status =
        SingleDeviceIssuanceStatus.Requested),
      (deviceGroupCertificateLogDTO.readvalue_watthour =
        deviceHistoryRequest.readsvalue),
      (deviceGroupCertificateLogDTO.certificate_payload = issuance),
      (deviceGroupCertificateLogDTO.countryCode = device.countryCode),
      (deviceGroupCertificateLogDTO.certificateTransactionUID =
        certificateTransactionUID.toString());
    await this.groupService.addCertificateIssueDateLogForDeviceGroup(
      deviceGroupCertificateLogDTO,
    );
    //const issuedCertificate = await
    this.issueCertificate(issuance);
    await this.readService.updateHistoryCertificateIssueDate(
      deviceHistoryRequest.id,
      deviceHistoryRequest.readsStartDate,
      deviceHistoryRequest.readsEndDate,
    );
    return;
  }

  public async handleLeftoverReadsByCountryCode(
    group: DeviceGroup,
    totalReadValueW: number,
    countryCodeKey: string,
  ): Promise<number> {
    // Logic
    // 1. Get the accumulated read values from devices
    // 2. Transform current value from watts to kw
    // 3. Add any leftover value from group to the current total value
    // 4. Separate all decimal values from the current kw value and store it as leftover value to the device group
    // 5. Return all the integer value from the current kw value (if any) and continue issuing the certificate
    this.logger.verbose(`With in handleLeftoverReadsByCountryCode`);
    const totalReadValueKw = group.leftoverReadsByCountryCode[countryCodeKey]
      ? totalReadValueW / 10 ** 3 +
        group.leftoverReadsByCountryCode[countryCodeKey]
      : totalReadValueW / 10 ** 3;
    const { integralVal, decimalVal } =
      this.separateIntegerAndDecimalByCountryCode(totalReadValueKw);
    await this.groupService.updateLeftOverReadByCountryCode(
      group.id,
      decimalVal,
      countryCodeKey,
    );

    return integralVal;
  }

  public separateIntegerAndDecimalByCountryCode(num: number): {
    integralVal: number;
    decimalVal: number;
  } {
    this.logger.verbose(`With in separateIntegerAndDecimalByCountryCode`);
    if (!num) {
      return { integralVal: 0, decimalVal: 0 };
    }
    const integralVal = Math.floor(num);
    const decimalVal = this.roundDecimalNumberByCountryCode(num - integralVal);
    return { integralVal, decimalVal };
  }

  public roundDecimalNumberByCountryCode(num: number): number {
    this.logger.verbose(`With in roundDecimalNumberByCountryCode`);
    if (num === 0) {
      return num;
    }
    const precision = 2;
    return Math.round(num * 10 ** precision) / 10 ** precision;
  }

  public async handleLeftoverReads(
    group: DeviceGroup,
    totalReadValueW: number,
  ): Promise<number> {
    this.logger.verbose(`With in handleLeftoverReads`);
    // Logic
    // 1. Get the accumulated read values from devices
    // 2. Transform current value from watts to kw
    // 3. Add any leftover value from group to the current total value
    // 4. Separate all decimal values from the current kw value and store it as leftover value to the device group
    // 5. Return all the integer value from the current kw value (if any) and continue issuing the certificate

    const totalReadValueKw = group.leftoverReads
      ? totalReadValueW / 10 ** 3 + group.leftoverReads
      : totalReadValueW / 10 ** 3;
    const { integralVal, decimalVal } =
      this.separateIntegerAndDecimal(totalReadValueKw);
    await this.groupService.updateLeftOverRead(group.id, decimalVal);

    return integralVal;
  }

  public separateIntegerAndDecimal(num: number): {
    integralVal: number;
    decimalVal: number;
  } {
    this.logger.verbose(`With in separateIntegerAndDecimal`);
    if (!num) {
      return { integralVal: 0, decimalVal: 0 };
    }
    const integralVal = Math.floor(num);
    const decimalVal = this.roundDecimalNumber(num - integralVal);
    return { integralVal, decimalVal };
  }

  public roundDecimalNumber(num: number): number {
    this.logger.verbose(`With in roundDecimalNumber`);
    if (num === 0) {
      return num;
    }
    const precision = 2;
    return Math.round(num * 10 ** precision) / 10 ** precision;
  }

  public async getDeviceFullReadsWithTimestampAndValueAsArray(
    meterId: string,
    filter: FilterDTO,
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    this.logger.verbose(
      `With in getDeviceFullReadsWithTimestampAndValueAsArray`,
    );

    try {
      const allReads: Array<{ timestamp: Date; value: number }> =
        await this.baseReadsService.find(meterId, filter);
      return allReads;
    } catch (e) {
      this.logger.error(
        'exception caught in in between device onboarding checking for createdAt',
      );
      this.logger.error(e);
    }
  }

  private async getDeviceFullReads(
    meterId: string,
    filter: FilterDTO,
  ): Promise<number> {
    this.logger.verbose(`With in getDeviceFullReads`);
    const allReads = await this.baseReadsService.find(meterId, filter);
    return allReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue.value,
      0,
    );
  }

  //actual definition is up removing async

  issueCertificateFromAPI(
    reading: IIssueCommandParams<ICertificateMetadata>,
  ): void {
    this.logger.verbose(`With in issueCertificateFromAPI`);
    reading.fromTime = new Date(reading.fromTime);
    reading.toTime = new Date(reading.toTime);
    this.issueCertificate(reading);
  }

  public issueCertificate(
    reading: IIssueCommandParams<ICertificateMetadata>,
  ): void {
    this.logger.log(`Issuing a certificate for reading`);
    this.offChainCertificateService.issue(reading);
  }

  getCertificateData(): void {
    const request: IGetAllCertificatesOptions = {
      // generationEndFrom: new Date(1677671426*1000),
      // generationEndTo: new Date(1677671426*1000),
      //  generationStartFrom :new Date(1646622684*1000),
      // generationStartTo: new Date(1648159894*1000),
      // creationTimeFrom: Date;
      //  creationTimeTo: Date;
      deviceId: '51',
    };

    this.offChainCertificateService.getAll(request).then(() => {
      this.logger.debug('certificates');
    });
  }

  @Cron('0 0 */2 * * *')
  async handleCronForOngoingLateIssuance(): Promise<void> {
    this.logger.debug('late ongoing issuance');
    this.logger.debug('Called every 2hr to check for issuance of certificates');
    const lateOngoing = await this.deviceService.findAllLateCycle();
    if (lateOngoing) {
      for (const element of lateOngoing) {
        const group = await this.groupService.findOne({ id: element.groupId });
        if (!group) {
          this.logger.error('LateOngoing group is missing');
          continue; // Skip to the next element if the group is missing
        }
        if (
          group.leftoverReadsByCountryCode === null ||
          group.leftoverReadsByCountryCode === undefined ||
          group.leftoverReadsByCountryCode === ''
        ) {
          group.leftoverReadsByCountryCode = {};
        }
        if (typeof group.leftoverReadsByCountryCode === 'string') {
          group.leftoverReadsByCountryCode = JSON.parse(
            group.leftoverReadsByCountryCode,
          );
        }
        if (
          group.reservationExpiryDate != null &&
          group.reservationExpiryDate.getTime() <= new Date().getTime()
        ) {
          this.logger.error('ReservationExpiryDate has passed');
          continue; // Skip to the next element if the reservation expiry date has passed
        }
        const device = await this.deviceService.findReads(
          element.device_externalid,
        );
        const newGroupWithSingleDevice: DeviceGroup = group;
        newGroupWithSingleDevice.devices = [device];
        const startDate = DateTime.fromISO(element.late_start_date).toUTC();
        const endDate = DateTime.fromISO(element.late_end_date).toUTC();
        const nextIssuance =
          await this.groupService.getGroupiCertificateIssueDate({
            groupId: group.id,
          });

        if (nextIssuance) {
          nextIssuance.start_date = element.late_start_date;
          nextIssuance.end_date = element.late_end_date;
        }
        const lastRead = await this.readService.latestRead(
          device.externalId,
          device.createdAt,
        );
        if (lastRead.length === 0) {
          this.logger.error('No last read found');
          continue; // Skip to the next element if no last read is found
        }
        if (
          new Date(lastRead[0].timestamp).getTime() <=
            new Date(element.late_end_date).getTime() &&
          new Date(lastRead[0].timestamp).getTime() >=
            new Date(element.late_start_date).getTime()
        ) {
          this.logger.verbose(
            'If Last read less from late end_date and greater then from latest_date',
          );
          const endDate1 = new Date(lastRead[0].timestamp).toISOString();
          const certifiedDevices =
            await this.deviceService.getCheckCertificateIssueDateLogForDevice(
              element.device_externalid,
              new Date(startDate.toString()),
              new Date(lastRead[0].timestamp.toString()),
            );
          const newStartDate = new Date(lastRead[0].timestamp);
          newStartDate.setTime(newStartDate.getTime() + 1); // Add one millisecond
          if (
            certifiedDevices.length === 0 &&
            new Date(newStartDate).getTime() !==
              new Date(element.late_start_date).getTime()
          ) {
            await this.deviceService.updateLateOngoing(
              device.externalId,
              element.id,
              new Date(lastRead[0].timestamp).toISOString(),
            );

            const isLateOngoingCycle =
              await this.deviceService.findDeviceLateCycleOfDateRange(
                group.id,
                device.externalId,
                DateTime.fromISO(
                  new Date(lastRead[0].timestamp).toISOString(),
                ).toUTC(),
                DateTime.fromISO(element.late_end_date).toUTC(),
              );

            if (!isLateOngoingCycle) {
              await this.addLateOngoingDeviceCertificateCycle(
                group.id,
                device.externalId,
                new Date(newStartDate).toISOString(),
                new Date(element.late_end_date).toISOString(),
              );
            }

            await this.lateOngoingIssueCertificateForGroup(
              newGroupWithSingleDevice,
              startDate,
              DateTime.fromISO(endDate1).toUTC(),
              device.countryCode,
              nextIssuance,
            );
          }
        } else {
          this.logger.verbose(
            'certified devices_else',
            new Date(startDate.toString()),
            new Date(endDate.toString()),
          );
          this.logger.verbose('else Last read greater then from late_end_date');
          const readsFilter: FilterDTO = {
            offset: 0,
            limit: 5000,
            start: startDate.toString(),
            end: endDate.toString(),
          };
          const allReadsForDeviceBetweenTimeRange =
            await this.getDeviceFullReadsWithTimestampAndValueAsArray(
              newGroupWithSingleDevice.devices[0].externalId,
              readsFilter,
            );
          if (allReadsForDeviceBetweenTimeRange.length > 0) {
            this.logger.verbose('if read are available in date range');
            await this.deviceService.updateLateOngoing(
              device.externalId,
              element.id,
              element.late_end_date,
            );

            await this.lateOngoingIssueCertificateForGroup(
              newGroupWithSingleDevice,
              startDate,
              endDate,
              device.countryCode,
              nextIssuance,
            );
          }
          // }
        }

        // Add delay before moving to the next element
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } else {
      this.logger.error('No late ongoing read found');
    }
  }

  public async lateOngoingIssueCertificateForGroup(
    group: DeviceGroup,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string,
    groupRequest?: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    this.logger.verbose(`With in newIssueCertificateForGroup late`);
    if (!group?.devices?.length) {
      this.logger.debug('Line No: 463');
      return;
    }
    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      this.logger.error(
        `No organization found with code ${group.organizationId}`,
      );
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }
    const readsFilter: FilterDTO = {
      offset: 0,
      limit: 5000,
      start: startDate.toString(),
      end: endDate.toString(),
    };
    let allReadsForDeviceBetweenTimeRange: Array<{
      timestamp: Date;
      value: number;
    }> = await this.getDeviceFullReadsWithTimestampAndValueAsArray(
      group.devices[0].externalId,
      readsFilter,
    );
    let deviceReadValue: number;
    if (allReadsForDeviceBetweenTimeRange != undefined) {
      if (
        group?.devices[0].meterReadtype === 'Delta' ||
        allReadsForDeviceBetweenTimeRange.length > 0
      ) {
        const FirstDeltaRead =
          await this.readService.getDeltaMeterReadsFirstEntryOfDevice(
            group?.devices[0].externalId,
          );
        allReadsForDeviceBetweenTimeRange =
          allReadsForDeviceBetweenTimeRange.filter(
            (v) =>
              !FirstDeltaRead.some(
                (e) => e.readsEndDate.getTime() === v.timestamp.getTime(),
              ),
          );
      }
      const certifiedDevices =
        await this.deviceService.getCheckCertificateIssueDateLogForDevice(
          group.devices[0].externalId,
          new Date(startDate.toString()),
          new Date(endDate.toString()),
        );

      if (
        certifiedDevices.length > 0 &&
        allReadsForDeviceBetweenTimeRange.length > 0
      ) {
        allReadsForDeviceBetweenTimeRange =
          allReadsForDeviceBetweenTimeRange.filter((ele) => {
            let readingInBetween = false;
            certifiedDevices.forEach((certifiedDevice) => {
              if (
                ele.timestamp.getTime() >=
                  new Date(
                    certifiedDevice.certificate_issuance_startdate,
                  ).getTime() &&
                ele.timestamp.getTime() <=
                  new Date(
                    certifiedDevice.certificate_issuance_enddate,
                  ).getTime()
              ) {
                readingInBetween = true;
              }
            });
            if (readingInBetween) {
              return false;
            } else {
              return true;
            }
          });
      }
      deviceReadValue = allReadsForDeviceBetweenTimeRange.reduce(
        (accumulator, currentValue) => accumulator + currentValue.value,
        0,
      );
      if (deviceReadValue === 0) {
        return;
      }
    }
    if (!group.buyerAddress || !group.buyerId) {
      return;
    }
    const certificateTransactionUID = uuid();

    let previousReading: Array<{ timestamp: Date; value: number }> = [];
    if (allReadsForDeviceBetweenTimeRange.length > 0) {
      const endTimestampToCheck = new Date(
        allReadsForDeviceBetweenTimeRange[0].timestamp.getTime() - 1,
      );
      const startTimeToCheck = group.devices[0].createdAt;

      try {
        previousReading =
          await this.readService.findLastReadForMeterWithinRange(
            group.devices[0].externalId,
            new Date(startTimeToCheck),
            endTimestampToCheck,
          );

        if (previousReading.length == 0) {
          if (group.devices[0].meterReadtype === ReadType.Delta) {
            previousReading = [
              { timestamp: new Date(group.devices[0].createdAt), value: 0 },
            ];
          } else if (group.devices[0].meterReadtype === ReadType.ReadMeter) {
            try {
              const aggregateReadings =
                await this.readService.getAggregateMeterReadsFirstEntryOfDevice(
                  group.devices[0].externalId,
                );
              if (aggregateReadings.length > 0) {
                previousReading = [
                  {
                    timestamp: new Date(aggregateReadings[0].datetime),
                    value: 0,
                  },
                ];
              }
            } catch (e) {
              this.logger.error(`error in getting aggregate read ${e}`);
            }
          }
        }
      } catch (e) {
        this.logger.error(`error in getting aggregate read ${e}`);
      }
    }
    const totalReadValueKw = await this.handleLeftoverReadsByCountryCode(
      group,
      deviceReadValue,
      countryCodeKey,
    );
    if (!totalReadValueKw) {
      return;
    }
    const issueTotalReadValue = totalReadValueKw * 10 ** 3; // Issue certificate in watts
    const deviceCertificateLogDTO =
      new CheckCertificateIssueDateLogForDeviceEntity();
    (deviceCertificateLogDTO.externalId = group.devices[0].externalId),
      (deviceCertificateLogDTO.certificate_issuance_startdate =
        previousReading.length > 0
          ? new Date(new Date(previousReading[0].timestamp).getTime() + 1000)
          : new Date(startDate.toString())),
      (deviceCertificateLogDTO.certificate_issuance_enddate =
        allReadsForDeviceBetweenTimeRange[
          allReadsForDeviceBetweenTimeRange.length - 1
        ].timestamp), // new Date(endDate.toString()),
      (deviceCertificateLogDTO.status = SingleDeviceIssuanceStatus.Requested),
      (deviceCertificateLogDTO.readvalue_watthour = deviceReadValue);
    (deviceCertificateLogDTO.groupId = group.id),
      (deviceCertificateLogDTO.certificateTransactionUID =
        certificateTransactionUID.toString());
    (deviceCertificateLogDTO.ongoing_start_date = startDate.toString()),
      (deviceCertificateLogDTO.ongoing_end_date = endDate.toString());
    await this.deviceService.addCertificateIssueDateLogForDevice(
      deviceCertificateLogDTO,
    );
    let minimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z');
    const checkMinimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z'); // eslint-disable-line @typescript-eslint/no-unused-vars
    minimumStartDate =
      previousReading.length > 0
        ? new Date(previousReading[0].timestamp.getTime() + 1000)
        : new Date(startDate.toString());
    let maximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z');
    const checkMaximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z'); // eslint-disable-line @typescript-eslint/no-unused-vars
    maximumEndDate =
      allReadsForDeviceBetweenTimeRange[
        allReadsForDeviceBetweenTimeRange.length - 1
      ].timestamp;

    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: issueTotalReadValue.toString(),
      fromTime: minimumStartDate, //new Date(startDate.toString()),
      toTime: maximumEndDate, //new Date(endDate.toString()),
      toAddress: group.buyerAddress,
      userId: group.buyerAddress,
      metadata: {
        version: 'v1.0',
        buyerReservationId: group.devicegroup_uid,
        isStandardIssuanceRequested: StandardCompliance.IREC,
        type: CertificateType.REC,
        deviceIds: group.devices.map((device: IDevice) => device.externalId),
        //deviceGroup,
        groupId: group.id?.toString() || null,
        certificateTransactionUID: certificateTransactionUID.toString(),
      },
    };
    const totalReadValueMegaWattHour = totalReadValueKw / 10 ** 3;
    this.groupService.updateTotalReadingRequestedForCertificateIssuance(
      group.id,
      group.organizationId,
      totalReadValueMegaWattHour,
    );
    if (
      group.reservationActive &&
      group.authorityToExceed === false &&
      group.targetVolumeCertificateGenerationRequestedInMegaWattHour +
        totalReadValueMegaWattHour >=
        group.targetVolumeInMegaWattHour
    ) {
      this.groupService.endReservation(group.id, group, groupRequest);
    }
    const deviceGroupCertificateLogDTO =
      new CheckCertificateIssueDateLogForDeviceGroupEntity();
    (deviceGroupCertificateLogDTO.groupid = group.id?.toString()),
      (deviceGroupCertificateLogDTO.certificate_issuance_startdate =
        minimumStartDate), //new Date(startDate.toString()),
      (deviceGroupCertificateLogDTO.certificate_issuance_enddate =
        maximumEndDate), //new Date(endDate.toString()),
      (deviceGroupCertificateLogDTO.status =
        SingleDeviceIssuanceStatus.Requested),
      (deviceGroupCertificateLogDTO.readvalue_watthour = issueTotalReadValue),
      (deviceGroupCertificateLogDTO.certificate_payload = issuance),
      (deviceGroupCertificateLogDTO.countryCode = countryCodeKey),
      (deviceGroupCertificateLogDTO.certificateTransactionUID =
        certificateTransactionUID.toString());
    await this.groupService.addCertificateIssueDateLogForDeviceGroup(
      deviceGroupCertificateLogDTO,
    );
    this.issueCertificate(issuance);
    return;
  }
  // @Cron('*/2 * * * * ')
  async getMissingCycleBeforeLateOngoing(): Promise<void> {
    this.logger.debug('Called every 4pm to check for issuance of certificates');
    const deviceGroups = await this.groupService.getAllReservationActive();
    await Promise.all(
      deviceGroups.map(async (groupRequest: DeviceGroup) => {
        const group = groupRequest;

        if (!group) {
          this.logger.error('late ongoing group is missing');
          return; // Return if group is missing
        }
        const deviceGroup = await this.deviceService.findForGroup(group.id);
        await Promise.all(
          deviceGroup.map(async (element) => {
            await this.groupService.getNextrequestCertificateBYgroupId(
              group.id,
            );

            const lateOngoing = await this.deviceService.findOneLateCycle(
              group.id,
              element.externalId,
            );
            if (!lateOngoing || lateOngoing.length === 0) {
              this.logger.error(
                'late ongoing data is missing for element',
                element.externalId,
              );
              return;
            }
            const end = new Date(lateOngoing[0].late_start_date);

            // Check if lateOngoing is valid and contains the necessary data
            const start = new Date(element.createdAt);
            let currentDate = new Date(start);
            while (currentDate < end) {
              const nextDate = new Date(currentDate);
              switch (group.frequency) {
                case 'hourly':
                  nextDate.setHours(nextDate.getHours() + 1);
                  break;
                case 'daily':
                  nextDate.setDate(nextDate.getDate() + 1);
                  break;
                case 'weekly':
                  nextDate.setDate(nextDate.getDate() + 7);
                  break;
                case 'monthly':
                  nextDate.setMonth(nextDate.getMonth() + 1);
                  break;
                case 'quarterly':
                  nextDate.setMonth(nextDate.getMonth() + 3);
                  break;
                default:
                  this.logger.error('Invalid frequency', group.frequency);
                  return; // Return if frequency is invalid
              }
              const startDate = DateTime.fromISO(
                currentDate.toISOString(),
              ).toUTC();
              const endDate = (nextDate < end ? nextDate : end).toISOString();
              const endDate1 = DateTime.fromISO(endDate).toUTC();
              const isLateOngoingCycle =
                await this.deviceService.findDeviceLateCycleOfDateRange(
                  group.id,
                  element.externalId,
                  startDate,
                  endDate1,
                );

              if (!isLateOngoingCycle) {
                await this.addLateOngoingDeviceCertificateCycle(
                  group.id,
                  element.externalId,
                  currentDate.toISOString(),
                  (nextDate < end ? nextDate : end).toISOString(),
                );
              }
              currentDate = nextDate;
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }),
        );
      }),
    );
  }
}
