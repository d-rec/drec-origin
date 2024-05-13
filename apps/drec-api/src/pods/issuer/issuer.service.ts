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
import { AnyARecord } from 'dns';
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
    private readservice: ReadsService,

    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadsService,
    private httpService: HttpService,
    private readonly offChainCertificateService: OffChainCertificateService<ICertificateMetadata>,
  ) {}

  hitTheCronFromIssuerAPIOngoing() {
    this.logger.verbose(`With in hitTheCronFromIssuerAPIOngoing`);

    this.httpService
      .get(`${process.env.REACT_APP_BACKEND_URL}/api/drec-issuer/ongoing`)
      .subscribe((response) => {});
  }

  hitTheCronFromIssuerAPIHistory() {
    this.logger.verbose(`With in hitTheCronFromIssuerAPIHistory`);

    this.httpService
      .get(`${process.env.REACT_APP_BACKEND_URL}/api/drec-issuer/history`)
      .subscribe((response) => {});
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron(): Promise<void> {
    this.logger.debug('Ongoing Cycle');
    this.logger.debug(
      'Called every 10 minutes to check for isssuance of certificates',
    );

    const groupsrequestall =
      await this.groupService.getAllNextrequestCertificate();
    await Promise.all(
      groupsrequestall.map(
        async (grouprequest: DeviceGroupNextIssueCertificate) => {
          const group = await this.groupService.findOne({
            id: grouprequest.groupId,
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

          var countryDevicegroup = await this.deviceService.NewfindForGroup(
            group.id,
          );

          const organization = await this.organizationService.findOne(
            group.organizationId,
          );
          group.organization = {
            name: organization.name,
            blockchainAccountAddress: organization.blockchainAccountAddress,
          };

          const startDate = DateTime.fromISO(grouprequest.start_date).toUTC();
          const endDate = DateTime.fromISO(grouprequest.end_date).toUTC();
          //console.log("151", startDate);
          // console.log("152", endDate);
          let start_date = endDate.toString();

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
          let end_date = new Date(
            new Date(new Date(endDate.toString())).getTime() + hours * 3.6e6,
          ).toISOString();

          let newEndDate: string = '';
          let skipUpdatingNextIssuanceLogTable: boolean = false;
          if (
            new Date(endDate.toString()).getTime() ===
            group.reservationEndDate.getTime()
          ) {
            skipUpdatingNextIssuanceLogTable = true;
            // console.log("end time reached for buyer reservation", group);
            let endDto = new EndReservationdateDTO();
            endDto.endresavationdate = new Date(group.reservationEndDate);
            await this.groupService.EndReservationGroup(
              group.id,
              group.organizationId,
              endDto,
              group,
              grouprequest,
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
            let allDevicesOfGroup: Device[] =
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

              let deviceOnBoardedWhichIsInBetweenNextIssuance: Device =
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
            await this.groupService.updatecertificateissuedate(
              grouprequest.id,
              start_date,
              newEndDate,
            );
          }

          this.logger.debug(`Start date ${startDate} - End date ${endDate}`);
          this.logger.error('ongoing countryDevicegroup is missing');
          // if (Object.keys(countryDevicegroup).length === 0) {
          const groupdevices = await this.deviceService.findForGroup(group.id);

          await Promise.all(
            groupdevices.map(async (device: IDevice) => {
              if (device.meterReadtype === null) {
                await this.addlateongoing_devicecertificatecycle(
                  group.id,
                  device.externalId,
                  startDate,
                  endDate,
                );
              }
            }),
          );

          for (let key in countryDevicegroup) {
            //deep clone to avoid duplicates
            let newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));
            newGroup.devices = countryDevicegroup[key];
            await this.newissueCertificateForGroup(
              newGroup,
              grouprequest,
              startDate,
              endDate,
              key,
            );
          }

          /*  this is use for generate certificate if frequency is weekly,monthly  
           if (endDate.diff(startDate, ['days']).days <= 1) {
             for (let key in countryDevicegroup) {
               //deep clone to avoid duplicates
               let newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));
               newGroup.devices = countryDevicegroup[key];
               // console.log("218line", startDate)
               // console.log("20619line", endDate)
               this.newissueCertificateForGroup(newGroup, grouprequest, startDate, endDate, key);
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
             for (let key in countryDevicegroup) {
               //deep clone to avoid duplicates
               let newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));
               newGroup.devices = countryDevicegroup[key];
               arrayofStartAndEndTimeDividedDifferenceBetweenAsOneDay.forEach((ele, index) => {
                 this.newissueCertificateForGroup(JSON.parse(JSON.stringify(newGroup)), JSON.parse(JSON.stringify(grouprequest)), ele.startDate, ele.endDate, key, index);
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
    const historydevicerequestall =
      await this.groupService.getNextHistoryissuanceDevicelog();
    await Promise.all(
      historydevicerequestall.map(
        async (
          historydevice: HistoryDeviceGroupNextIssueCertificate,
          historydevicerequestindex: number,
        ) => {
          const group = await this.groupService.findOne({
            id: historydevice.groupId,
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
            historydevice.device_externalid,
          );
          const Histroryread =
            await this.readservice.getCheckHistoryCertificateIssueDateLogForDevice(
              historydevice.device_externalid,
              historydevice.reservationStartDate,
              historydevice.reservationEndDate,
            );

          if (Histroryread?.length > 0) {
            await Promise.all(
              Histroryread.map(
                async (historydeviceread: HistoryIntermediate_MeterRead) => {
                  this.newHistoryissueCertificateForDevice(
                    group,
                    historydeviceread,
                    device,
                  );
                },
              ),
            );
            let totalhistoryreadforsingledevices = 0;
            Histroryread.forEach(
              (historydeviceread: HistoryIntermediate_MeterRead) => {
                if (!group.buyerAddress || !group.buyerId) {
                  return;
                }
                // minimum value of certificate should be 1 Kw =1000W.
                if (historydeviceread.readsvalue < 1000) {
                  return;
                }
                totalhistoryreadforsingledevices =
                  totalhistoryreadforsingledevices +
                  historydeviceread.readsvalue;
              },
            );
            let totalReadValueMegaWattHour =
              totalhistoryreadforsingledevices / 10 ** 6;

            if (totalReadValueMegaWattHour != 0) {
              setTimeout(
                () => {
                  this.groupService.updateTotalReadingRequestedForCertificateIssuance(
                    group.id,
                    group.organizationId,
                    totalReadValueMegaWattHour,
                  );
                },
                1000 * (historydevicerequestindex + 1),
              );
            }
            await this.groupService.HistoryUpdatecertificateissuedate(
              historydevice.id,
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
          await this.groupService.HistoryUpdatecertificateissuedate(
            historydevice.id,
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
            await this.groupService.countgroupIdHistoryissuanceDevicelog(
              historydevice.groupId,
            );
          const checknextongoingissueance =
            await this.groupService.getGroupiCertificateIssueDate({
              groupId: group.id,
            });

          if (count === 0 && !checknextongoingissueance) {
            if (group.reservationExpiryDate !== null) {
              if (
                group.reservationExpiryDate.getTime() <=
                  group.reservationEndDate.getTime() ||
                group.reservationExpiryDate.getTime() <= new Date().getTime()
              ) {
                await this.groupService.deactiveReaservation(group);
              }
            }
          }
        },
      ),
    );
  }

  private async addlateongoing_devicecertificatecycle(
    groupId: number,
    device_externalid: string,
    late_start_date,
    late_end_date,
  ) {
    let latedevicecertificatelogDto =
      new DeviceLateongoingIssueCertificateEntity();
    (latedevicecertificatelogDto.device_externalid = device_externalid),
      (latedevicecertificatelogDto.groupId = groupId),
      (latedevicecertificatelogDto.late_start_date =
        late_start_date.toString()),
      (latedevicecertificatelogDto.late_end_date = late_end_date.toString());
    return await this.deviceService.AddLateCertificateIssueDateLogForDevice(
      latedevicecertificatelogDto,
    );
  }

  private async newissueCertificateForGroup(
    group: DeviceGroup,
    grouprequest: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string,
    dateindex?: number,
  ): Promise<void> {
    console.log('newissueCertificateForGroup');
    this.logger.verbose(`With in newissueCertificateForGroup`);
    // console.log(`With in newissueCertificateForGroup`, group, grouprequest, startDate, endDate, countryCodeKey);

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
    let allDevicesCompleteReadsBetweenTimeRange: Array<
      Array<{ timestamp: Date; value: number }>
    > = [];
    let filteredDevicesIndexesListIfMeterReadsNotAvailable: Array<number> = [];
    /*Get all devices meter reads between time range */
    /*https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop refer to answer why map and async works */
    await Promise.all(
      group.devices.map(async (device: IDevice, index: number) => {
        /*
         day: 24 hours entries if hourly data  is sent , implies max entries 24 for one device
         30 days issuance : max entrries 30*24 = 720
        quarterly: issuance : max entrries  3 months: 31*3*24 = 2232
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
              await this.readservice.getDeltaMeterReadsFirstEntryOfDevice(
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

          const certifieddevices =
            await this.deviceService.getCheckCertificateIssueDateLogForDevice(
              device.externalId,
              new Date(startDate.toString()),
              new Date(endDate.toString()),
            );
          if (
            certifieddevices.length > 0 &&
            allReadsForDeviceBetweenTimeRange.length > 0
          ) {
            allReadsForDeviceBetweenTimeRange =
              allReadsForDeviceBetweenTimeRange.filter((ele) => {
                let readingInBetween: boolean = false;
                certifieddevices.forEach((certifieddevicesEle) => {
                  if (
                    ele.timestamp.getTime() >=
                      new Date(
                        certifieddevicesEle.certificate_issuance_startdate,
                      ).getTime() &&
                    ele.timestamp.getTime() <=
                      new Date(
                        certifieddevicesEle.certificate_issuance_enddate,
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
          let devciereadvalue = allReadsForDeviceBetweenTimeRange.reduce(
            (accumulator, currentValue) => accumulator + currentValue.value,
            0,
          );
          if (devciereadvalue === 0) {
            filteredDevicesIndexesListIfMeterReadsNotAvailable.push(index);
            const Islateongoingcycle =
              await this.deviceService.finddeviceLateCycleOfdaterange(
                group.id,
                device.externalId,
                startDate,
                endDate,
              );

            if (!Islateongoingcycle) {
              await this.addlateongoing_devicecertificatecycle(
                group.id,
                device.externalId,
                startDate,
                endDate,
              );
            }
          }
          groupReads[index] = devciereadvalue;
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
    let allPreviousReadingsOfDevices: Array<{
      timestamp: Date;
      value: number;
    }> = [];
    let certificateTransactionUID = uuid();
    await Promise.all(
      group.devices.map(async (device: IDevice, index) => {
        console.log(
          'came inside previous readings check',
          allDevicesCompleteReadsBetweenTimeRange[index],
        );
        let previousReading: Array<{ timestamp: Date; value: number }> = [];
        if (allDevicesCompleteReadsBetweenTimeRange[index].length > 0) {
          let endTimestampToCheck = new Date(
            allDevicesCompleteReadsBetweenTimeRange[
              index
            ][0].timestamp.getTime() - 1000,
          );
          let startTimeToCheck = device.createdAt;
          try {
            previousReading =
              await this.readservice.findLastReadForMeterWithinRange(
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
                  let aggregateReadings =
                    await this.readservice.getAggregateMeterReadsFirstEntryOfDevice(
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
        let devciereadvalue = allDevicesCompleteReadsBetweenTimeRange[
          index
        ].reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );

        let devicecertificatelogDto =
          new CheckCertificateIssueDateLogForDeviceEntity();
        (devicecertificatelogDto.externalId = device.externalId),
          (devicecertificatelogDto.certificate_issuance_startdate =
            previousReading.length > 0
              ? previousReading[0].timestamp
              : new Date(startDate.toString())),
          (devicecertificatelogDto.certificate_issuance_enddate =
            allDevicesCompleteReadsBetweenTimeRange[index][
              allDevicesCompleteReadsBetweenTimeRange[index].length - 1
            ].timestamp), // new Date(endDate.toString()),
          (devicecertificatelogDto.status =
            SingleDeviceIssuanceStatus.Requested),
          (devicecertificatelogDto.readvalue_watthour = devciereadvalue);
        (devicecertificatelogDto.groupId = group.id),
          (devicecertificatelogDto.certificateTransactionUID =
            certificateTransactionUID.toString());
        (devicecertificatelogDto.ongoing_start_date = grouprequest.start_date),
          (devicecertificatelogDto.ongoing_end_date = grouprequest.end_date);
        await this.deviceService.AddCertificateIssueDateLogForDevice(
          devicecertificatelogDto,
        );
      }),
    );
    //find the minimum of all previous reading dates of devices  and use it as start date
    let minimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z');
    let checkMinimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z');
    if (allPreviousReadingsOfDevices.length == 1) {
      minimumStartDate = allPreviousReadingsOfDevices[0].timestamp;
    }
    if (allPreviousReadingsOfDevices.length > 1) {
      allPreviousReadingsOfDevices.sort(function (a, b) {
        return Number(a.timestamp) - Number(b.timestamp);
      });
      minimumStartDate = allPreviousReadingsOfDevices[0].timestamp;
    }
    let maximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z');
    let checkMaximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z');

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
    let totalReadValueMegaWattHour = totalReadValueKw / 10 ** 3;
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
      this.groupService.endReservation(group.id, group, grouprequest);
    }
    let devicegroupcertificatelogDto =
      new CheckCertificateIssueDateLogForDeviceGroupEntity();
    (devicegroupcertificatelogDto.groupid = group.id?.toString()),
      (devicegroupcertificatelogDto.certificate_issuance_startdate =
        minimumStartDate), //new Date(startDate.toString()),
      (devicegroupcertificatelogDto.certificate_issuance_enddate =
        maximumEndDate), //new Date(endDate.toString()),
      (devicegroupcertificatelogDto.status =
        SingleDeviceIssuanceStatus.Requested),
      (devicegroupcertificatelogDto.readvalue_watthour = issueTotalReadValue),
      (devicegroupcertificatelogDto.certificate_payload = issuance),
      (devicegroupcertificatelogDto.countryCode = countryCodeKey),
      (devicegroupcertificatelogDto.certificateTransactionUID =
        certificateTransactionUID.toString());
    await this.groupService.AddCertificateIssueDateLogForDeviceGroup(
      devicegroupcertificatelogDto,
    );
    this.issueCertificate(issuance);
    return;
  }
  timerForHistoyIssuanceCounter: number = 0;

  private async newHistoryissueCertificateForDevice(
    group: DeviceGroup,
    devicehistoryrequest: HistoryIntermediate_MeterRead,
    device: IDevice,
  ): Promise<void> {
    if (!group.buyerAddress || !group.buyerId) {
      return;
    }
    // minimum value of certificate should be 1 Kw =1000W.
    if (devicehistoryrequest.readsvalue < 1000) {
      return;
    }
    let certificateTransactionUID = uuid();
    let devicecertificatelogDto =
      new CheckCertificateIssueDateLogForDeviceEntity();
    (devicecertificatelogDto.externalId = device.externalId),
      (devicecertificatelogDto.certificate_issuance_startdate = new Date(
        devicehistoryrequest.readsStartDate.toString(),
      )),
      (devicecertificatelogDto.certificate_issuance_enddate = new Date(
        devicehistoryrequest.readsEndDate.toString(),
      )),
      (devicecertificatelogDto.status = SingleDeviceIssuanceStatus.Requested),
      (devicecertificatelogDto.readvalue_watthour =
        devicehistoryrequest.readsvalue);
    devicecertificatelogDto.groupId = group.id;
    devicecertificatelogDto.certificateTransactionUID =
      certificateTransactionUID.toString();
    await this.deviceService.AddCertificateIssueDateLogForDevice(
      devicecertificatelogDto,
    );
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: devicehistoryrequest.readsvalue.toString(),
      fromTime: new Date(devicehistoryrequest.readsStartDate.toString()),
      toTime: new Date(devicehistoryrequest.readsEndDate.toString()),
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
    let devicegroupcertificatelogDto =
      new CheckCertificateIssueDateLogForDeviceGroupEntity();
    (devicegroupcertificatelogDto.groupid = group.id?.toString()),
      (devicegroupcertificatelogDto.certificate_issuance_startdate = new Date(
        devicehistoryrequest.readsStartDate.toString(),
      )), //new Date(startDate.toString()),
      (devicegroupcertificatelogDto.certificate_issuance_enddate = new Date(
        devicehistoryrequest.readsEndDate.toString(),
      )), //new Date(endDate.toString()),
      (devicegroupcertificatelogDto.status =
        SingleDeviceIssuanceStatus.Requested),
      (devicegroupcertificatelogDto.readvalue_watthour =
        devicehistoryrequest.readsvalue),
      (devicegroupcertificatelogDto.certificate_payload = issuance),
      (devicegroupcertificatelogDto.countryCode = device.countryCode),
      (devicegroupcertificatelogDto.certificateTransactionUID =
        certificateTransactionUID.toString());
    await this.groupService.AddCertificateIssueDateLogForDeviceGroup(
      devicegroupcertificatelogDto,
    );
    //const issuedCertificate = await
    this.issueCertificate(issuance);
    await this.readservice.updatehistorycertificateissuedate(
      devicehistoryrequest.id,
      devicehistoryrequest.readsStartDate,
      devicehistoryrequest.readsEndDate,
    );
    return;
  }

  private async handleLeftoverReadsByCountryCode(
    group: DeviceGroup,
    totalReadValueW: number,
    countryCodeKey: string,
  ): Promise<number> {
    // Logic
    // 1. Get the accummulated read values from devices
    // 2. Transform current value from watts to kw
    // 3. Add any leftover value from group to the current total value
    // 4. Separate all decimal values from the curent kw value and store it as leftover value to the device group
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

  private separateIntegerAndDecimalByCountryCode(num: number): {
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

  private roundDecimalNumberByCountryCode(num: number): number {
    this.logger.verbose(`With in roundDecimalNumberByCountryCode`);
    if (num === 0) {
      return num;
    }
    const precision = 2;
    return Math.round(num * 10 ** precision) / 10 ** precision;
  }

  private async handleLeftoverReads(
    group: DeviceGroup,
    totalReadValueW: number,
  ): Promise<number> {
    this.logger.verbose(`With in handleLeftoverReads`);
    // Logic
    // 1. Get the accummulated read values from devices
    // 2. Transform current value from watts to kw
    // 3. Add any leftover value from group to the current total value
    // 4. Separate all decimal values from the curent kw value and store it as leftover value to the device group
    // 5. Return all the integer value from the current kw value (if any) and continue issuing the certificate

    const totalReadValueKw = group.leftoverReads
      ? totalReadValueW / 10 ** 3 + group.leftoverReads
      : totalReadValueW / 10 ** 3;
    const { integralVal, decimalVal } =
      this.separateIntegerAndDecimal(totalReadValueKw);
    await this.groupService.updateLeftOverRead(group.id, decimalVal);

    return integralVal;
  }

  private separateIntegerAndDecimal(num: number): {
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

  private roundDecimalNumber(num: number): number {
    this.logger.verbose(`With in roundDecimalNumber`);
    if (num === 0) {
      return num;
    }
    const precision = 2;
    return Math.round(num * 10 ** precision) / 10 ** precision;
  }

  private async getDeviceFullReadsWithTimestampAndValueAsArray(
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
        'exception caught in inbetween device onboarding checking for createdAt',
      );
      this.logger.error(e);
    }
  }

  private async getDeviceFullReads(
    meterId: string,
    filter: FilterDTO,
  ): Promise<number> {
    this.logger.verbose(`With in getDeviceFullReads`);
    //console.log("381")
    const allReads = await this.baseReadsService.find(meterId, filter);
    //console.log(`allReads externalId:${meterId}`, allReads);
    return allReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue.value,
      0,
    );
  }

  //actual definition is up removing async

  issueCertificateFromAPI(reading: IIssueCommandParams<ICertificateMetadata>) {
    this.logger.verbose(`With in issueCertificateFromAPI`);
    reading.fromTime = new Date(reading.fromTime);
    reading.toTime = new Date(reading.toTime);
    this.issueCertificate(reading);
  }

  private issueCertificate(reading: IIssueCommandParams<ICertificateMetadata>) {
    this.logger.log(`Issuing a certificate for reading`);
    this.offChainCertificateService.issue(reading);
  }

  getCertificateData(deviceId?: string) {
    let request: IGetAllCertificatesOptions = {
      // generationEndFrom: new Date(1677671426*1000),
      // generationEndTo: new Date(1677671426*1000),
      //  generationStartFrom :new Date(1646622684*1000),
      // generationStartTo: new Date(1648159894*1000),
      // creationTimeFrom: Date;
      //  creationTimeTo: Date;
      deviceId: '51',
    };

    this.offChainCertificateService.getAll(request).then((result) => {
      this.logger.debug('certificates');
    });
  }

  @Cron('0 */1 * * *')
  async handleCronForOngoingLateIssuance(): Promise<void> {
    this.logger.debug('late ongoing issuance');
    this.logger.debug(
      'Called every 4hr to check for isssuance of certificates',
    );
    const devicegroups = await this.groupService.getallReservationactive();
    //this.logger.debug("groupsrequestall",groupsrequestall);
    await Promise.all(
      devicegroups.map(async (grouprequest: DeviceGroup) => {
        const group = grouprequest;
        if (!group) {
          this.logger.error('late ongoing group is missing');
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
        var countryDevicegroup = await this.deviceService.NewfindForGroup(
          group.id,
        );
        const organization = await this.organizationService.findOne(
          group.organizationId,
        );
        group.organization = {
          name: organization.name,
          blockchainAccountAddress: organization.blockchainAccountAddress,
        };
        const nextissuance =
          await this.groupService.getGroupiCertificateIssueDate({
            groupId: group.id,
          });
        this.logger.debug(nextissuance);
        for (let key in countryDevicegroup) {
          //deep clone to avoid duplicates
          let newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));

          newGroup.devices = countryDevicegroup[key];
          await Promise.all(
            newGroup.devices.map(async (element) => {
              const lateongoing = await this.deviceService.findAllLateCycle(
                group.id,
                element.externalId,
                group.reservationEndDate,
              );

              if (lateongoing) {
                let newGroupwithsingledevice: DeviceGroup = JSON.parse(
                  JSON.stringify(newGroup),
                );
                newGroupwithsingledevice.devices = [element];

                await Promise.all(
                  lateongoing.map(async (element1) => {
                    let startDate = DateTime.fromISO(
                      element1.late_start_date,
                    ).toUTC();
                    let endDate = DateTime.fromISO(
                      element1.late_end_date,
                    ).toUTC();
                    nextissuance.start_date = element1.late_start_date;
                    nextissuance.end_date = element1.late_end_date;
                    const certifieddevices =
                      await this.deviceService.getCheckCertificateIssueDateLogForDevice(
                        element1.device_externalid,
                        new Date(startDate.toString()),
                        new Date(endDate.toString()),
                      );

                    if (certifieddevices.length === 0) {
                      await this.LateOngoingissueCertificateForGroup(
                        newGroupwithsingledevice,
                        nextissuance,
                        startDate,
                        endDate,
                        key,
                      );
                    }
                  }),
                );
              } else {
                this.logger.error('late ongoing read is missing');
                return;
              }
            }),
          );
        }
      }),
    );
  }
  private async LateOngoingissueCertificateForGroup(
    group: DeviceGroup,
    grouprequest: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string,
    dateindex?: number,
  ): Promise<void> {
    console.log('newissueCertificateForGroup');
    this.logger.verbose(`With in newissueCertificateForGroup`);
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
    // console.log(readsFilter)
    let allReadsForDeviceBetweenTimeRange: Array<{
      timestamp: Date;
      value: number;
    }> = await this.getDeviceFullReadsWithTimestampAndValueAsArray(
      group.devices[0].externalId,
      readsFilter,
    );
    //console.log("482readdata", index, allReadsForDeviceBetweenTimeRange);
    let devciereadvalue: number;
    if (allReadsForDeviceBetweenTimeRange != undefined) {
      if (
        group?.devices[0].meterReadtype === 'Delta' ||
        allReadsForDeviceBetweenTimeRange.length > 0
      ) {
        const FirstDeltaRead =
          await this.readservice.getDeltaMeterReadsFirstEntryOfDevice(
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
      const certifieddevices =
        await this.deviceService.getCheckCertificateIssueDateLogForDevice(
          group.devices[0].externalId,
          new Date(startDate.toString()),
          new Date(endDate.toString()),
        );

      if (
        certifieddevices.length > 0 &&
        allReadsForDeviceBetweenTimeRange.length > 0
      ) {
        allReadsForDeviceBetweenTimeRange =
          allReadsForDeviceBetweenTimeRange.filter((ele) => {
            let readingInBetween: boolean = false;
            certifieddevices.forEach((certifieddevicesEle) => {
              if (
                ele.timestamp.getTime() >=
                  new Date(
                    certifieddevicesEle.certificate_issuance_startdate,
                  ).getTime() &&
                ele.timestamp.getTime() <=
                  new Date(
                    certifieddevicesEle.certificate_issuance_enddate,
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
      devciereadvalue = allReadsForDeviceBetweenTimeRange.reduce(
        (accumulator, currentValue) => accumulator + currentValue.value,
        0,
      );
      if (devciereadvalue === 0) {
        return;
      }
    }
    if (!group.buyerAddress || !group.buyerId) {
      return;
    }
    let certificateTransactionUID = uuid();

    let previousReading: Array<{ timestamp: Date; value: number }> = [];
    if (allReadsForDeviceBetweenTimeRange.length > 0) {
      let endTimestampToCheck = new Date(
        allReadsForDeviceBetweenTimeRange[0].timestamp.getTime() - 1,
      );
      let startTimeToCheck = group.devices[0].createdAt;

      try {
        previousReading =
          await this.readservice.findLastReadForMeterWithinRange(
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
              let aggregateReadings =
                await this.readservice.getAggregateMeterReadsFirstEntryOfDevice(
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
      devciereadvalue,
      countryCodeKey,
    );
    if (!totalReadValueKw) {
      return;
    }
    const issueTotalReadValue = totalReadValueKw * 10 ** 3; // Issue certificate in watts
    let devicecertificatelogDto =
      new CheckCertificateIssueDateLogForDeviceEntity();
    (devicecertificatelogDto.externalId = group.devices[0].externalId),
      (devicecertificatelogDto.certificate_issuance_startdate =
        previousReading.length > 0
          ? previousReading[0].timestamp
          : new Date(startDate.toString())),
      (devicecertificatelogDto.certificate_issuance_enddate =
        allReadsForDeviceBetweenTimeRange[
          allReadsForDeviceBetweenTimeRange.length - 1
        ].timestamp), // new Date(endDate.toString()),
      (devicecertificatelogDto.status = SingleDeviceIssuanceStatus.Requested),
      (devicecertificatelogDto.readvalue_watthour = devciereadvalue);
    (devicecertificatelogDto.groupId = group.id),
      (devicecertificatelogDto.certificateTransactionUID =
        certificateTransactionUID.toString());
    (devicecertificatelogDto.ongoing_start_date = grouprequest.start_date),
      (devicecertificatelogDto.ongoing_end_date = grouprequest.end_date);
    await this.deviceService.AddCertificateIssueDateLogForDevice(
      devicecertificatelogDto,
    );

    let minimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z');
    let checkMinimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z');
    minimumStartDate =
      previousReading.length > 0
        ? previousReading[0].timestamp
        : new Date(startDate.toString());
    let maximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z');
    let checkMaximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z');
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
    let totalReadValueMegaWattHour = totalReadValueKw / 10 ** 3;
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
      this.groupService.endReservation(group.id, group, grouprequest);
    }
    let devicegroupcertificatelogDto =
      new CheckCertificateIssueDateLogForDeviceGroupEntity();
    (devicegroupcertificatelogDto.groupid = group.id?.toString()),
      (devicegroupcertificatelogDto.certificate_issuance_startdate =
        minimumStartDate), //new Date(startDate.toString()),
      (devicegroupcertificatelogDto.certificate_issuance_enddate =
        maximumEndDate), //new Date(endDate.toString()),
      (devicegroupcertificatelogDto.status =
        SingleDeviceIssuanceStatus.Requested),
      (devicegroupcertificatelogDto.readvalue_watthour = issueTotalReadValue),
      (devicegroupcertificatelogDto.certificate_payload = issuance),
      (devicegroupcertificatelogDto.countryCode = countryCodeKey),
      (devicegroupcertificatelogDto.certificateTransactionUID =
        certificateTransactionUID.toString());
    await this.groupService.AddCertificateIssueDateLogForDeviceGroup(
      devicegroupcertificatelogDto,
    );
    this.issueCertificate(issuance);
    return;
  }
}
