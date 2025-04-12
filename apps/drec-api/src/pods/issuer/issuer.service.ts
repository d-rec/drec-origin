import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { FilterDTO } from '@energyweb/energy-api-influxdb';
import { IIssueCommandParams } from '@energyweb/origin-247-certificate';
import { HttpService } from '@nestjs/axios';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import { ICertificateMetadata } from '../../utils/types';

import { IDevice } from '../../models';
import {
  CertificateGenerationFrequency,
  CertificateType,
  ReadType,
  SingleDeviceIssuanceStatus,
  StandardCompliance,
} from '../../utils/enums';
import { HistoryNextIssuanceStatus } from '../../utils/enums/history_next_issuance.enum';
import { Device } from '../device';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from '../device-group/check_certificate_issue_date_log_for_device_group.entity';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity';
import { EndReservationDateDTO } from '../device-group/dto';
import { HistoryDeviceGroupNextIssueCertificate } from '../device-group/history_next_issuance_date_log.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { DeviceService } from '../device/device.service';
import { OrganizationService } from '../organization/organization.service';
import { HistoryIntermediateMeterRead } from '../reads/history_intermideate_meterread.entity';
import { ReadsService } from '../reads/reads.service';
import { CertificateService } from './certificate.service';
import { LateOngoingIssuanceService } from './late-ongoing-issuance.service';

@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);

  constructor(
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    private readService: ReadsService,
    private httpService: HttpService,
    private readonly certificateService: CertificateService,
    private lateOngoingIssuanceService: LateOngoingIssuanceService,
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
      await this.groupService.getAllNextRequestCertificate();
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
          const startDateFormatted = endDate.toString();

          let hours = 1;
          const frequency = group.frequency.toLowerCase();
          if (frequency === CertificateGenerationFrequency.daily) {
            hours = 1 * 24;
          } else if (frequency === CertificateGenerationFrequency.monthly) {
            hours = 30 * 24;
          } else if (frequency === CertificateGenerationFrequency.weekly) {
            hours = 7 * 24;
          } else if (frequency === CertificateGenerationFrequency.quarterly) {
            hours = 91 * 24;
          }
          const endDateFormatted = new Date(
            new Date(new Date(endDate.toString())).getTime() + hours * 3.6e6,
          ).toISOString();

          let newEndDate = '';
          let skipUpdatingNextIssuanceLogTable = false;
          if (
            new Date(endDate.toString()).getTime() ===
            group.reservationEndDate.getTime()
          ) {
            skipUpdatingNextIssuanceLogTable = true;
            const endDTO = new EndReservationDateDTO();
            endDTO.endresavationdate = new Date(group.reservationEndDate);
            await this.groupService.endReservationGroup(
              group.id,
              group.organizationId,
              endDTO,
              group,
              groupRequest,
            );
          }
          if (!skipUpdatingNextIssuanceLogTable) {
            if (
              new Date(endDateFormatted).getTime() <
              group.reservationEndDate.getTime()
            ) {
              newEndDate = endDateFormatted;
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
                      new Date(startDateFormatted).getTime() &&
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
              startDateFormatted,
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
                await this.lateOngoingIssuanceService.addCycle(
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
      await this.groupService.getNextHistoryIssuanceDeviceLog();

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
                async (historyDeviceRead: HistoryIntermediateMeterRead) => {
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
              (historyDeviceRead: HistoryIntermediateMeterRead) => {
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
              HistoryNextIssuanceStatus.Completed,
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
            HistoryNextIssuanceStatus.Completed,
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
            await this.groupService.getGroupCertificateIssueDate({
              groupId: group.id,
            });

          if (count === 0 && !checkNextOngoingIssuance) {
            if (group.reservationExpiryDate !== null) {
              if (
                group.reservationExpiryDate.getTime() <=
                  group.reservationEndDate.getTime() ||
                group.reservationExpiryDate.getTime() <= new Date().getTime()
              ) {
                await this.groupService.deactivateReservation(group);
              }
            } else {
              await this.groupService.deactivateReservation(group);
            }
          }
        },
      ),
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
        }> = await this.readService.find(device.externalId, readsFilter);
        if (allReadsForDeviceBetweenTimeRange != undefined) {
          if (
            device.meterReadtype === 'Delta' ||
            allReadsForDeviceBetweenTimeRange.length > 0
          ) {
            const firstDeltaRead =
              await this.readService.getDeltaMeterReadsFirstEntryOfDevice(
                device.externalId,
              );
            allReadsForDeviceBetweenTimeRange =
              allReadsForDeviceBetweenTimeRange.filter(
                (v) =>
                  !firstDeltaRead.some(
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
              await this.lateOngoingIssuanceService.addCycle(
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
                await this.lateOngoingIssuanceService.addCycle(
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
    const totalReadValueKw =
      await this.groupService.processLeftOverReadsByCountryCode(
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
    this.certificateService.issue(issuance);
    return;
  }

  public async newHistoryIssueCertificateForDevice(
    group: DeviceGroup,
    deviceHistoryRequest: HistoryIntermediateMeterRead,
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
    const issuance = this.certificateService.getIssuanceParams(
      group,
      [device],
      deviceHistoryRequest.readsvalue,
      new Date(deviceHistoryRequest.readsStartDate.toString()),
      new Date(deviceHistoryRequest.readsEndDate.toString()),
      certificateTransactionUID.toString(),
    );
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
    this.certificateService.issue(issuance);
    await this.readService.updateHistoryCertificateIssueDate(
      deviceHistoryRequest.id,
      deviceHistoryRequest.readsStartDate,
      deviceHistoryRequest.readsEndDate,
    );
    return;
  }
}
