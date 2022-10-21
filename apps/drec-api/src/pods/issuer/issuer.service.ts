import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CertificateService,
  CERTIFICATE_SERVICE_TOKEN,
  IIssueCommandParams,
  IIssuedCertificate,
  ITransferCommand,
} from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../utils/types';
import { DateTime } from 'luxon';
import {
  FilterDTO,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';
import { DeviceService } from '../device/device.service';
import { BASE_READ_SERVICE } from '../reads/const';
import { OrganizationService } from '../organization/organization.service';
import { DeviceGroupService } from '../device-group/device-group.service';
import { IDevice, BuyerReservationCertificateGenerationFrequency } from '../../models';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity'
import { AnyARecord } from 'dns';
import { EndReservationdateDTO } from '../device-group/dto';
import { CertificateType, ReadType, SingleDeviceIssuanceStatus, StandardCompliance } from '../../utils/enums'
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity'
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from '../device-group/check_certificate_issue_date_log_for_device_group.entity'
import { HistoryDeviceGroupNextIssueCertificate } from '../device-group/history_next_issuance_date_log.entity'
import { ReadsService } from '../reads/reads.service'
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { Device } from '../device';
@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);

  constructor(
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    private readservice: ReadsService,
    @Inject(CERTIFICATE_SERVICE_TOKEN)
    private readonly certificateService: CertificateService<ICertificateMetadata>,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadsService,
  ) { }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // @Cron('0 00 21 * * *') // Every day at 23:30 - Server Time
  // async handleCron(): Promise<void> {
  //   this.logger.debug('Called every day at 23:30 Server time');

  //   const startDate = DateTime.now().minus({ days: 1 }).toUTC();
  //   const endDate = DateTime.now().minus({ minute: 1 }).toUTC();

  //   this.logger.debug(`Start date ${startDate} - End date ${endDate}`);

  //   const groups = await this.groupService.getAll();
  //   await Promise.all(
  //     groups.map(async (group: DeviceGroup) => {


  //       group.devices = await this.deviceService.findForGroup(group.id);
  //       const organization = await this.organizationService.findOne(
  //         group.organizationId,
  //       );
  //       group.organization = {
  //         name: organization.name,
  //         blockchainAccountAddress: organization.blockchainAccountAddress,
  //       };
  //       return await this.issueCertificateForGroup(group, startDate, endDate);
  //     }),
  //   );
  // }
  //@Cron('0 00 21 * * *')

  @Cron(CronExpression.EVERY_30_SECONDS)
  //@Cron('0 59 * * * *')
  //@Cron('0 */10 * * * *')
  async handleCron(): Promise<void> {
    this.logger.debug('Called every 10 minutes to check for isssuance of certificates');

    const startDate1 = DateTime.now().minus({ days: 1 }).toUTC();
    const endDate1 = DateTime.now().minus({ minute: 1 }).toUTC();

    this.logger.debug(`Start date ${startDate1} - End date ${endDate1}`);

    const groupsrequestall = await this.groupService.getAllNextrequestCertificate();
    //this.logger.debug("groupsrequestall",groupsrequestall);
    await Promise.all(
      groupsrequestall.map(async (grouprequest: DeviceGroupNextIssueCertificate) => {
        console.log("79");
        console.log(new Date());
        const group = await this.groupService.findOne(
          { id: grouprequest.groupId }
        );
        if (!group) {
          console.error("group is missing", grouprequest.groupId);
          return;//if group is missing
        }
        if (group.leftoverReadsByCountryCode === null || group.leftoverReadsByCountryCode === undefined || group.leftoverReadsByCountryCode === '') {
          group.leftoverReadsByCountryCode = {};
        }
        if (typeof group.leftoverReadsByCountryCode === 'string') {
          group.leftoverReadsByCountryCode = JSON.parse(group.leftoverReadsByCountryCode);
        }
        console.log("84");
        this.logger.debug('87');
        // throw new NotFoundException(`No device found with id`);


        //  const requestdate = await this.groupService.getGroupiCertificateIssueDate({ groupId: group.id });
        //this.logger.debug(requestdate);

          console.error("group is missing", grouprequest.groupId);
          var countryDevicegroup = await this.deviceService.NewfindForGroup(group.id,grouprequest.end_date);
        this.logger.debug(countryDevicegroup);
        const organization = await this.organizationService.findOne(
          group.organizationId,
        );
        group.organization = {
          name: organization.name,
          blockchainAccountAddress: organization.blockchainAccountAddress,
        };

        const startDate = DateTime.fromISO(grouprequest.start_date).toUTC();
        const endDate = DateTime.fromISO(grouprequest.end_date).toUTC();
        let start_date = endDate.toString();
        console.log(start_date);

        let hours = 1;
        const frequency = group.frequency.toLowerCase();
        if (frequency === BuyerReservationCertificateGenerationFrequency.daily) {
          hours = 1 * 24;
        } else if (frequency === BuyerReservationCertificateGenerationFrequency.monhtly) {
          hours = 30 * 24;
        } else if (frequency === BuyerReservationCertificateGenerationFrequency.quarterly) {
          hours = 7 * 24;
        } else if (frequency === BuyerReservationCertificateGenerationFrequency.quarterly) {
          hours = 91 * 24;
        }
        let end_date = new Date((new Date(new Date(endDate.toString())).getTime() + (hours * 3.6e+6))).toISOString()
        console.log(end_date);
        console.log('284');
        console.log(typeof group.reservationEndDate);
        console.log(group.reservationEndDate);
        console.log(group.reservationEndDate.toISOString());
        let newEndDate: string = '';
        let skipUpdatingNextIssuanceLogTable: boolean = false;
        if (new Date(endDate.toString()).getTime() === group.reservationEndDate.getTime()) {
          skipUpdatingNextIssuanceLogTable = true;
          console.log("end time reached for buyer reservation", group);
          let endDto = new EndReservationdateDTO();
          endDto.endresavationdate = new Date(group.reservationEndDate);
          await this.groupService.EndReservationGroup(group.id, group.organizationId, endDto, group, grouprequest);
        }
        if (!skipUpdatingNextIssuanceLogTable) {
          if (new Date(end_date).getTime() < group.reservationEndDate.getTime()) {
            newEndDate = end_date;
          }
          else {
            newEndDate = group.reservationEndDate.toISOString();
          }
          let allDevicesOfGroup: Device[] = await this.deviceService.findForGroup(group.id);

          try {
            //https://stackoverflow.com/a/10124053
            allDevicesOfGroup.sort(function (a, b) {
              // Turn your strings into dates, and then subtract them
              // to get a value that is either negative, positive, or zero.
              //@ts-ignore
              return new Date(b.createdAt) - new Date(a.createdAt);
            })

            let deviceOnBoardedWhichIsInBetweenNextIssuance: Device = allDevicesOfGroup.find(ele => {
              //returns first find which is minimum and between next frequency 
              if (new Date(ele.createdAt).getTime() > new Date(start_date).getTime() && new Date(ele.createdAt).getTime() < new Date(newEndDate).getTime()) {
                return true;
              }
            })
            if (deviceOnBoardedWhichIsInBetweenNextIssuance) {
              newEndDate = new Date(deviceOnBoardedWhichIsInBetweenNextIssuance.createdAt).toISOString();
            }
          }
          catch (e) {
            console.error("exception caught in inbetween device onboarding checking for createdAt");
            console.error(e);
          }


          console.log("came isnide updating next issuance date");
          console.log("start_date", start_date, "newEndDate", newEndDate);
          await this.groupService.updatecertificateissuedate(grouprequest.id, start_date, newEndDate);
        }

        this.logger.debug(`Start date ${startDate} - End date ${endDate}`);
        for (let key in countryDevicegroup) {
          console.log(`${key}: "${countryDevicegroup[key]}"`);
          console.log('98');
          //deep clone to avoid duplicates
          let newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));
          newGroup.devices = countryDevicegroup[key];
          console.log("154", newGroup);
          console.log('100');
          this.newissueCertificateForGroup(newGroup, grouprequest, startDate, endDate, key);
        }
      }),
    );
  }

  // private groupBy(array: any, key: any): Promise<{ [key: string]: Device[] }> {
  //   console.log(array)

  //   return array.reduce((result: any, currentValue: any) => {

  //     (result[currentValue[key]] = result[currentValue[key]] || []).push(
  //       currentValue
  //     );

  //     return result;
  //   }, {});
  // };

  /*clear this out when development is completed */

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkingReadsData(){
   let meterId='AD42';
   const readsFilter: FilterDTO = {
    offset: 0,
    limit: 1000,
    start: '2020-10-20T11:02:21.486Z',
    end: '2022-10-20T11:02:21.486Z',
  };

      console.log("sldkmalksmd")
      const allReads:Array<{timestamp:Date,value:number}> = await this.getDeviceFullReadsWithTimestampAndValueAsArray(meterId,readsFilter);
      console.log(`allReads externalId:${meterId}`, allReads);
      if(allReads.length>0)
      {
        const readsFilter: FilterDTO = {
          offset: 0,
          limit: 1000,
          start: '2020-10-20T11:02:21.486Z',
          end: '2022-01-02T19:22:05.614Z',
        };
        allReads[0].timestamp.toISOString()
        
      }

      let response = await this.readservice.findLastReadForMeterWithinRange(meterId,new Date('2020-10-20T11:02:21.486Z'),new Date(new Date('2022-01-02T19:22:05.614Z').getTime()-1));

      console.log("findLastReadForMeterWithinRange", response);
      // console.log(typeof allReads[0].timestamp.getTime());
      // return allReads.reduce(
      //   (accumulator, currentValue) => accumulator + currentValue.value,
      //   0,
      // );
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCronForHistoricalIssuance(): Promise<void> {

    const historydevicerequestall = await this.groupService.getNextHistoryissuanceDevicelog();
    console.log(historydevicerequestall);
    await Promise.all(
      historydevicerequestall.map(async (historydevice: HistoryDeviceGroupNextIssueCertificate) => {
        console.log("200");
        console.log(historydevice);

        const group = await this.groupService.findOne(
          { id: historydevice.groupId }
        );
        if (!group) {
          console.error("group is missing", historydevice.groupId);
          return;//if group is missing
        }

        const organization = await this.organizationService.findOne(
          group.organizationId,
        );
        group.organization = {
          name: organization.name,
          blockchainAccountAddress: organization.blockchainAccountAddress,
        };
        const Histroryread = await this.readservice.getCheckHistoryCertificateIssueDateLogForDevice(
          historydevice.device_externalid,
          historydevice.reservationStartDate,
          historydevice.reservationEndDate

        );
        if (!Histroryread?.length) {
          return;
        }
        console.log("Histroryread", Histroryread);
        await Promise.all(
          Histroryread.map(async (historydeviceread: HistoryIntermediate_MeterRead) => {
            const devcie = await this.deviceService.findReads(
              historydeviceread.deviceId,
            );
            console.log("Histroryread", historydevice);
            this.newHistoryissueCertificateForDevice(group, historydeviceread, devcie);
          }),
        );
        await this.groupService.HistoryUpdatecertificateissuedate(historydevice.id);


      }),
    )
  }



  private async issueCertificateForGroup(
    group: DeviceGroup,
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<void> {
    const readsFilter: FilterDTO = {
      offset: 0,
      limit: 1000,
      start: startDate.toString(),
      end: endDate.toString(),
    };

    if (!group?.devices?.length) {
      return;
    }
    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }
    const groupReads: number[] = [];
    await Promise.all(
      group.devices.map(async (device: IDevice) =>
        groupReads.push(
          await this.getDeviceFullReads(device.externalId, readsFilter),
        ),
      ),
    );
    const totalReadValue = groupReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    );

    if (!totalReadValue) {
      return;
    }

    const totalReadValueKw = await this.handleLeftoverReads(
      group,
      totalReadValue,
    );

    if (!totalReadValueKw) {
      return;
    }

    const issueTotalReadValue = totalReadValueKw * 10 ** 3; // Issue certificate in watts

    const deviceGroup = {
      ...group,
      devices: [],
    };
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: issueTotalReadValue.toString(),
      fromTime: new Date(startDate.toString()),
      toTime: new Date(endDate.toString()),
      toAddress: org.blockchainAccountAddress,
      userId: org.blockchainAccountAddress,
      metadata: {
        version: "v1.0",
        buyerReservationId: group.devicegroup_uid,
        deviceIds: group.devices.map((device: IDevice) => device.id),
        //deviceGroup,
        groupId: group.id?.toString() || null,
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    const issuedCertificate = await this.issueCertificate(issuance);
    await this.transferCertificateToBuyer(group, issuedCertificate);
    return;
  }
  private async newissueCertificateForGroup(
    group: DeviceGroup,
    grouprequest: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string
  ): Promise<void> {
    
    if (!group?.devices?.length) {
      return;
    }
    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }
    const groupReads: number[] = [];
    let allDevicesCompleteReadsBetweenTimeRange:Array<Array<{timestamp:Date,value:number}>>=[];

    let filteredDevicesIndexesListIfMeterReadsNotAvailable:Array<number> =[];
    
    

    /*Get all devices meter reads between time range */
    /*https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop refer to answer why map and async works */
    await Promise.all(
      group.devices.map(async (device: IDevice,index:number) => {
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
        console.log(readsFilter);

        let allReadsForDeviceBetweenTimeRange:Array<{timestamp:Date,value:number}>= await this.getDeviceFullReadsWithTimestampAndValueAsArray(device.externalId, readsFilter);
        allDevicesCompleteReadsBetweenTimeRange.push(allReadsForDeviceBetweenTimeRange);
        let devciereadvalue = allReadsForDeviceBetweenTimeRange.reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );
        if(devciereadvalue ===0)
        {
          filteredDevicesIndexesListIfMeterReadsNotAvailable.push(index);
        }
        groupReads.push(devciereadvalue);
      }),
    );

    if(filteredDevicesIndexesListIfMeterReadsNotAvailable.length >0)
    {
      filteredDevicesIndexesListIfMeterReadsNotAvailable.forEach(index=>{
        group.devices.splice(index, 1);
        allDevicesCompleteReadsBetweenTimeRange.splice(index,1);
        groupReads.splice(index,1);
      })
    }

    if(group.devices.length ===0)
    {
      //after filtering if devices are not there then do not continue further 
      return;
    }

    console.log(groupReads);
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
      countryCodeKey
    );

    if (!totalReadValueKw) {
      return;
    }

    const issueTotalReadValue = totalReadValueKw * 10 ** 3; // Issue certificate in watts

    const deviceGroup = {
      ...group,
      devices: [],
    };
    if (

      !group.buyerAddress ||
      !group.buyerId ||
      !group.organization?.blockchainAccountAddress
    ) {
      return;
    }
    let allPreviousReadingsOfDevices:Array<{timestamp:Date,value:number}>=[];

    await Promise.all(
      group.devices.map(async (device: IDevice,index) => {
        let previousReading:Array<{timestamp:Date,value:number}> =[];
      if(allDevicesCompleteReadsBetweenTimeRange[index].length >0)
      {
        let endTimestampToCheck =new Date(allDevicesCompleteReadsBetweenTimeRange[index][0].timestamp.getTime()-1);
        let startTimeToCheck = device.createdAt;
        previousReading = await this.readservice.findLastReadForMeterWithinRange(device.externalId,startTimeToCheck,endTimestampToCheck);
        if(previousReading.length ==0)
        {
          if(device.meterReadtype=== ReadType.Delta)
          {
            previousReading=[{timestamp:device.createdAt,value:0}];
          }
          else if(device.meterReadtype=== ReadType.ReadMeter)
          {
            let aggregateReadings = await this.readservice.getAggregateMeterReadsFirstEntryOfDevice(device.externalId);
            console.log("aggregateReadings",aggregateReadings);
          }
        } 
        
        //change this to when was initial reading came for aggregate or else if delta then its the createdAt
        allPreviousReadingsOfDevices.push(previousReading[0]);
      }
      let devciereadvalue = allDevicesCompleteReadsBetweenTimeRange[index].reduce(
        (accumulator, currentValue) => accumulator + currentValue.value,
        0,
      );
      let devicecertificatelogDto = new CheckCertificateIssueDateLogForDeviceEntity();
        devicecertificatelogDto.deviceid = device.externalId,
          devicecertificatelogDto.certificate_issuance_startdate = previousReading.length > 1? previousReading[0].timestamp : new Date(startDate.toString()),
          devicecertificatelogDto.certificate_issuance_enddate = allDevicesCompleteReadsBetweenTimeRange[index][allDevicesCompleteReadsBetweenTimeRange[index].length-1].timestamp,// new Date(endDate.toString()),
          devicecertificatelogDto.status = SingleDeviceIssuanceStatus.Requested,
          devicecertificatelogDto.readvalue_watthour = devciereadvalue;
        devicecertificatelogDto.groupId = group.id;
        await this.deviceService.AddCertificateIssueDateLogForDevice(devicecertificatelogDto);
      }),
    );
    //find the minimum of all previous reading dates of devices  and use it as start date 
    let minimumStartDate:Date=new Date('1970-04-01T12:51:51.112Z');
    let checkMinimumStartDate:Date=new Date('1970-04-01T12:51:51.112Z');
    if(allPreviousReadingsOfDevices.length==1)
    {
      minimumStartDate = allPreviousReadingsOfDevices[0].timestamp;
    }
    if(allPreviousReadingsOfDevices.length>1)
    {
      allPreviousReadingsOfDevices.sort(function(a,b){
        //@ts-ignore
        return a.timestamp - b.timestamp;
      })
    }
    
  let maximumEndDate:Date=new Date('1990-04-01T12:51:51.112Z');
  let checkMaximumEndDate:Date=new Date('1990-04-01T12:51:51.112Z');

  if(allDevicesCompleteReadsBetweenTimeRange.length ==1)
  {
    maximumEndDate = allDevicesCompleteReadsBetweenTimeRange[0][allDevicesCompleteReadsBetweenTimeRange[0].length-1].timestamp;
  }
  else if(allDevicesCompleteReadsBetweenTimeRange.length > 1)
  {
    allDevicesCompleteReadsBetweenTimeRange.forEach(ele=>{
      if(ele.length > 0)//if there are readings take last index reading as its the earliest date 
      {
        if(ele[ele.length-1].timestamp.getTime() > maximumEndDate.getTime() )
        {
          maximumEndDate = ele[ele.length-1].timestamp;
        }
      }
  
    })
  }

  

  const issuance: IIssueCommandParams<ICertificateMetadata> = {
    deviceId: group.id?.toString(), // This is the device group id not a device id
    energyValue: issueTotalReadValue.toString(),
    fromTime: minimumStartDate,//new Date(startDate.toString()),
    toTime: maximumEndDate,//new Date(endDate.toString()),
    toAddress: group.buyerAddress,
    userId: group.buyerAddress,
    metadata: {
      version: "v1.0",
      buyerReservationId: group.devicegroup_uid,
      isStandardIssuanceRequested: StandardCompliance.IREC,
      type: CertificateType.REC,
      deviceIds: group.devices.map((device: IDevice) => device.id),
      //deviceGroup,
      groupId: group.id?.toString() || null,
    },
  };
  this.logger.log(
    `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
  );
  let totalReadValueMegaWattHour = totalReadValueKw / 10 ** 3;
  this.groupService.updateTotalReadingRequestedForCertificateIssuance(group.id, group.organizationId, totalReadValueMegaWattHour);
  if (group.authorityToExceed === false && (group.targetVolumeCertificateGenerationRequestedInMegaWattHour + totalReadValueMegaWattHour) >= group.targetVolumeInMegaWattHour) {
    this.groupService.endReservationGroupIfTargetVolumeReached(group.id, group, grouprequest);
  }
  let devicegroupcertificatelogDto = new CheckCertificateIssueDateLogForDeviceGroupEntity();
  devicegroupcertificatelogDto.groupid = group.id?.toString(),
    devicegroupcertificatelogDto.certificate_issuance_startdate = minimumStartDate,//new Date(startDate.toString()),
    devicegroupcertificatelogDto.certificate_issuance_enddate = maximumEndDate,//new Date(endDate.toString()),
    devicegroupcertificatelogDto.status = SingleDeviceIssuanceStatus.Requested,
    devicegroupcertificatelogDto.readvalue_watthour = issueTotalReadValue,
    devicegroupcertificatelogDto.certificate_payload = issuance,
    devicegroupcertificatelogDto.countryCode = countryCodeKey;
  await this.groupService.AddCertificateIssueDateLogForDeviceGroup(devicegroupcertificatelogDto);


    const issuedCertificate = await this.issueCertificate(issuance);
    console.log("generate Succesfull");
    // if (issuedCertificate) {
    //   await Promise.all(
    //     group.devices.map(async (device: IDevice) => {


    //     }
    //     ),
    //   );
    // }
    // issuedCertificate.then(result=>{
    //   console.log("353 in after issued certificate result",result);


    // }).catch(error=>{
    //       console.error("requesting for issuance failed",error);
    // })



    return;
  }
  private async newHistoryissueCertificateForDevice(
    group: DeviceGroup,
    devicehistoryrequest: HistoryIntermediate_MeterRead,
    device: IDevice
  ): Promise<void> {
    if (
      !group.buyerAddress ||
      !group.buyerId ||
      !group.organization?.blockchainAccountAddress
    ) {
      return;
    }
    let devicecertificatelogDto = new CheckCertificateIssueDateLogForDeviceEntity();
    devicecertificatelogDto.deviceid = device.externalId,
      devicecertificatelogDto.certificate_issuance_startdate = new Date(devicehistoryrequest.readsStartDate.toString()),
      devicecertificatelogDto.certificate_issuance_enddate = new Date(devicehistoryrequest.readsEndDate.toString()),
      devicecertificatelogDto.status = SingleDeviceIssuanceStatus.Requested,
      devicecertificatelogDto.readvalue_watthour = devicehistoryrequest.readsvalue;
    devicecertificatelogDto.groupId = group.id;
    await this.deviceService.AddCertificateIssueDateLogForDevice(devicecertificatelogDto);
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: devicehistoryrequest.readsvalue.toString(),
      fromTime: new Date(devicehistoryrequest.readsStartDate.toString()),
      toTime: new Date(devicehistoryrequest.readsEndDate.toString()),
      toAddress: group.buyerAddress,
      userId: group.buyerAddress,
      metadata: {
        version: "v1.0",
        buyerReservationId: group.devicegroup_uid,
        isStandardIssuanceRequested: StandardCompliance.IREC,
        type: CertificateType.REC,
        deviceIds: [device.id],
        //deviceGroup,
        groupId: group.id?.toString() || null,
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    const issuedCertificate = await this.issueCertificate(issuance);

    console.log("generate Succesfull");
    await this.readservice.updatehistorycertificateissuedate(devicehistoryrequest.id, devicehistoryrequest.readsStartDate, devicehistoryrequest.readsEndDate);


    return;
  }

  private async transferCertificateToBuyer(
    group: DeviceGroup,
    certificate: IIssuedCertificate<ICertificateMetadata>,
  ) {
    if (
      !certificate ||
      !group.buyerAddress ||
      !group.buyerId ||
      !group.organization?.blockchainAccountAddress
    ) {
      return;
    }
    this.logger.log(`Transfering a certificate`);
    const transferCommand: ITransferCommand = {
      certificateId: certificate.id,
      fromAddress: group.organization.blockchainAccountAddress,
      toAddress: group.buyerAddress,
      energyValue: certificate.energy.publicVolume,
    };
    await this.certificateService.transfer(transferCommand);
  }

  private async handleLeftoverReadsByCountryCode(
    group: DeviceGroup,
    totalReadValueW: number,
    countryCodeKey: string
  ): Promise<number> {
    // Logic
    // 1. Get the accummulated read values from devices
    // 2. Transform current value from watts to kw
    // 3. Add any leftover value from group to the current total value
    // 4. Separate all decimal values from the curent kw value and store it as leftover value to the device group
    // 5. Return all the integer value from the current kw value (if any) and continue issuing the certificate

    const totalReadValueKw = group.leftoverReadsByCountryCode[countryCodeKey]
      ? totalReadValueW / 10 ** 3 + group.leftoverReadsByCountryCode[countryCodeKey]
      : totalReadValueW / 10 ** 3;
    const { integralVal, decimalVal } =
      this.separateIntegerAndDecimalByCountryCode(totalReadValueKw);
    await this.groupService.updateLeftOverReadByCountryCode(group.id, decimalVal, countryCodeKey);

    return integralVal;
  }

  private separateIntegerAndDecimalByCountryCode(num: number): {
    integralVal: number;
    decimalVal: number;
  } {
    if (!num) {
      return { integralVal: 0, decimalVal: 0 };
    }
    const integralVal = Math.floor(num);
    const decimalVal = this.roundDecimalNumberByCountryCode(num - integralVal);
    return { integralVal, decimalVal };
  }

  private roundDecimalNumberByCountryCode(num: number): number {
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
    if (!num) {
      return { integralVal: 0, decimalVal: 0 };
    }
    const integralVal = Math.floor(num);
    const decimalVal = this.roundDecimalNumber(num - integralVal);
    return { integralVal, decimalVal };
  }

  private roundDecimalNumber(num: number): number {
    if (num === 0) {
      return num;
    }
    const precision = 2;
    return Math.round(num * 10 ** precision) / 10 ** precision;
  }

  private async getDeviceFullReadsWithTimestampAndValueAsArray(
    meterId: string,
    filter: FilterDTO,
  ): Promise<Array<{timestamp:Date,value:number}>> {
    console.log("381")
    const allReads:Array<{timestamp:Date,value:number}> = await this.baseReadsService.find(meterId, filter);
    console.log(`allReads externalId:${meterId}`, allReads);
    return allReads;
  }

  private async getDeviceFullReads(
    meterId: string,
    filter: FilterDTO,
  ): Promise<number> {
    console.log("381")
    const allReads = await this.baseReadsService.find(meterId, filter);
    console.log(`allReads externalId:${meterId}`, allReads);
    return allReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue.value,
      0,
    );
  }

  private async issueCertificate(
    reading: IIssueCommandParams<ICertificateMetadata>,
  ): Promise<IIssuedCertificate<ICertificateMetadata>> {
    this.logger.log(`Issuing a certificate for reading`);
    const issuedCertificate = await this.certificateService.issue(reading);
    this.logger.log(`Issued a certificate with ID ${issuedCertificate.id}`);
    return issuedCertificate;
  }
}
