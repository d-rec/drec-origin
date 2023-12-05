import {
  Controller,
  Get,
  Post,
  Patch,
  HttpStatus,
  Param,
  Body,
  UseGuards,
  Delete,
  Query,
  ValidationPipe,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import {
  validate,
  validateOrReject,
  Contains,
  IsInt,
  Length,
  IsEmail,
  IsFQDN,
  IsDate,
  Min,
  Max,
} from 'class-validator';


import { DeviceGroupService } from './device-group.service';
import {
  AddGroupDTO,
  DeviceGroupDTO,
  DeviceIdsDTO,
  SelectableDeviceGroupDTO,
  UnreservedDeviceGroupsFilterDTO,
  UpdateDeviceGroupDTO,
  ReserveGroupsDTO,
  CSVBulkUploadDTO,
  JobFailedRowsDTO,
  EndReservationdateDTO,
  NewUpdateDeviceGroupDTO,
  ResponseDeviceGroupDTO
} from './dto';
import { Roles } from '../user/decorators/roles.decorator';
import { Installation, OffTaker, Role, Sector, StandardCompliance } from '../../utils/enums';
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import { RolesGuard } from '../../guards/RolesGuard';
import { UserDecorator } from '../user/decorators/user.decorator';
import { DeviceDescription, ILoggedInUser, BuyerReservationCertificateGenerationFrequency } from '../../models';
import { NewDeviceDTO } from '../device/dto';
import { File, FileService } from '../file';

import { parse } from 'csv-parse';
import * as fs from 'fs';
import { Readable } from 'stream';

import csv from 'csv-parser';
import { DeviceCsvFileProcessingJobsEntity, StatusCSV } from './device_csv_processing_jobs.entity';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { PermissionGuard } from '../../guards';
import { DeviceGroupNextIssueCertificate } from './device_group_issuecertificate.entity';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from './check_certificate_issue_date_log_for_device_group.entity'
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';

@ApiTags('buyer-reservation')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/buyer-reservation')
export class BuyerReservationController {
  csvParser = csv({ separator: ',' });

  parser = parse({
    delimiter: ','
  });
  constructor(private readonly deviceGroupService: DeviceGroupService, 
              private readonly fileService: FileService, 
              private organizationService: OrganizationService,
              private readonly userService: UserService,
              ) { }

  /**
   * It is GET api to list all device group data
   * @returns {Array<DeviceGroupDTO>}
   */
  @Get()
  @ApiOkResponse({
    type: [DeviceGroupDTO],
    description: 'Returns all Device groups',
  })
  async getAll(): Promise<DeviceGroupDTO[]> {
    // return new Promise((resolve,reject)=>{
    //   resolve([]);
    // });
    /* for now commenting because ui is giving error because it has removed fields sectors standard complaince of devices */
    return this.deviceGroupService.getAll();
  }


  /**
   * It is GET api to list all device groups of loggedIn user
   * @param param0 is getting userId, organizationId and user role from user at request
   * @param filterDto is filteration fields to retrieve records
   * @param pagenumber is for pagination
   * @returns {Array<DeviceGroupDTO>}
   */
  @Get('/my')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.OrganizationAdmin, Role.DeviceOwner, Role.Buyer,Role.SubBuyer)
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns my Device groups',
  })
  async getMyDevices(
    @UserDecorator() { id, organizationId, role }: ILoggedInUser,
    @Query(new ValidationPipe({
      transform: true,
      whitelist: true,
    })) filterDto: UnreservedDeviceGroupsFilterDTO,
    
    @Query('pagenumber') pagenumber: number| null,
  )/*: Promise<DeviceGroupDTO[]> */{
    switch (role) {
      case Role.DeviceOwner:
        return await this.deviceGroupService.getOrganizationDeviceGroups(
          organizationId);
      case Role.Buyer:
        return await this.deviceGroupService.getBuyerDeviceGroups(id,pagenumber,filterDto);
        case Role.SubBuyer:
        return await this.deviceGroupService.getBuyerDeviceGroups(id,pagenumber,filterDto);
      case Role.OrganizationAdmin:
        return await this.deviceGroupService.getAll();
      default:
        return await this.deviceGroupService.getOrganizationDeviceGroups(
          organizationId);
    }
  }

  /**
   * It is GET api to fetch device group by id
   * @param id is unique identifier of device groupId
   * @returns {DeviceGroupDTO | null} DeviceGroupDto is when the record found, returns null when the record not found by id
   */
  @Get('/:id')
  @ApiOkResponse({
    type: DeviceGroupDTO,
    description: 'Returns a Device group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  async get(@Param('id') id: number): Promise<DeviceGroupDTO | null> {
    return this.deviceGroupService.findById(id);
  }

  /**
   * It is POSTb api to create an device group
   * @param param0 is getting organization Id from user request
   * @param user is getting uset from user request
   * @param deviceGroupToRegister body payload to create device group
   * @returns {ResponseDeviceGroupDTO | null}
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), AuthGuard('oauth2-client-password'), RolesGuard)
  // @Roles(Role.DeviceOwner, Role.Admin,Role.Buyer)
  @Roles(Role.Admin, Role.ApiUser, Role.Buyer)
  @ApiQuery({ name: 'orgId', type: Number, required: false, description: "This query parameter is used for Apiuser" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async createOne(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @UserDecorator() user: ILoggedInUser,
    @Body() deviceGroupToRegister: AddGroupDTO,
    @Query('orgId') orgId : number | null,
  ): Promise<ResponseDeviceGroupDTO | null> {

    if (orgId) {
      const organization = await this.organizationService.findOne(orgId);
      const orguser = await this.userService.findByEmail(organization.orgEmail);
      if (user.role === Role.ApiUser) {

          if (organization.api_user_id !== user.api_user_id) {
              throw new BadRequestException({
                  success: false,
                  message: 'Organization requested belongs to other apiuser',
              });
          }

          if (orguser.role === Role.Buyer) {
              console.log("when apiuser is buyer");
              organizationId = orgId;
              deviceGroupToRegister.api_user_id = user.api_user_id;
              console.log("reservation apiuserId:",deviceGroupToRegister.api_user_id);
          }

          if(orguser.role != Role.Buyer) {
            throw new UnauthorizedException({
              success: false,
              message: `Unauthorized for ${orguser.role}`,
            });
          }
      }
      else {
        if (user.role === Role.Buyer) {
          
          if (organizationId !== organization.id) {
              throw new BadRequestException({
                  success: false,
                  message: 'User does not associated with the requested organization',
              });
          }
        }
      }
    }
    //integer range which is for deviceId in device(id) table
    //-2147483648 to +2147483647
    //https://www.postgresql.org/docs/9.1/datatype-numeric.html

    if (!Array.isArray(deviceGroupToRegister.deviceIds) || deviceGroupToRegister.deviceIds.filter(ele => ele >= -2147483648 && ele <= 2147483647).length !== deviceGroupToRegister.deviceIds.length) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: 'One or more device ids are invalid',
          }),
        );
      });
    }
    if (deviceGroupToRegister.deviceIds.length == 0) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: 'Please provide devices for reservation, deviceIds is empty atleast one device is required',
          }),
        );
      });

    }

    if (isNaN(deviceGroupToRegister.targetCapacityInMegaWattHour) || deviceGroupToRegister.targetCapacityInMegaWattHour <= 0 || deviceGroupToRegister.targetCapacityInMegaWattHour == -0) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: 'targetCapacityInMegaWattHour should be valid number can include decimal but should be greater than 0',
          }),
        );
      });
    }

    if (typeof deviceGroupToRegister.reservationStartDate === "string") {
      if (!isValidUTCDateFormat(deviceGroupToRegister.reservationStartDate)) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: ' Invalid reservationStartDate, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
            }),
          );
        });
      }
      deviceGroupToRegister.reservationStartDate = new Date(deviceGroupToRegister.reservationStartDate);
    }
    if (typeof deviceGroupToRegister.reservationEndDate === "string") {
      if (!isValidUTCDateFormat(deviceGroupToRegister.reservationEndDate)) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: ' Invalid reservationEndDate, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
            }),
          );
        });
      }
      deviceGroupToRegister.reservationEndDate = new Date(deviceGroupToRegister.reservationEndDate);
    }

    if (deviceGroupToRegister.reservationStartDate && deviceGroupToRegister.reservationEndDate && deviceGroupToRegister.reservationStartDate.getTime() >= deviceGroupToRegister.reservationEndDate.getTime()) {
      throw new ConflictException({
        success: false,
        message: 'start date cannot be less than or same as end date',
      });
    }
    let maximumBackDateForReservation: Date = new Date(new Date().getTime() - (3.164e+10 * 3));
    if (deviceGroupToRegister.reservationStartDate.getTime() <= maximumBackDateForReservation.getTime() || deviceGroupToRegister.reservationEndDate.getTime() <= maximumBackDateForReservation.getTime()) {

      throw new ConflictException({
        success: false,
        message: 'start date or end date cannot be less than 3 year from current date',
      });
    }
    if (organizationId === null || organizationId === undefined) {

      throw new ConflictException({
        success: false,
        message: 'User does not has organization associated',
      });
    }
    const frequency = deviceGroupToRegister.frequency.toLowerCase();
    if (frequency === BuyerReservationCertificateGenerationFrequency.monthly || frequency === BuyerReservationCertificateGenerationFrequency.quarterly||frequency === BuyerReservationCertificateGenerationFrequency.weekly) {

      throw new ConflictException({
        success: false,
        message: 'This frequency is currently not supported',
      });
    }
    console.log(deviceGroupToRegister.blockchainAddress);
     //@ts-ignore
     console.log(process.env.DREC_BLOCKCHAIN_ADDRESS);
    return await this.deviceGroupService.createOne(
      organizationId,
      deviceGroupToRegister,
      user.id,
      //@ts-ignore
      process.env.DREC_BLOCKCHAIN_ADDRESS,
      
    );
    // if (deviceGroupToRegister.blockchainAddress !== null && deviceGroupToRegister.blockchainAddress !== undefined && deviceGroupToRegister.blockchainAddress.trim() !== "") {
    //   console.log("deviceGroupToRegister.blockchainAddress");
    //   deviceGroupToRegister.blockchainAddress = deviceGroupToRegister.blockchainAddress.trim();

    //   return await this.deviceGroupService.createOne(
    //     organizationId,
    //     deviceGroupToRegister,
    //     user.id,
    //     deviceGroupToRegister.blockchainAddress
    //   );

    // } else {
    //   console.log(user.blockchainAccountAddress);
    //   if (user.blockchainAccountAddress !== null && user.blockchainAccountAddress !== undefined) {
    //     console.log("user.blockchainAddress")
    //     return await this.deviceGroupService.createOne(
    //       organizationId,
    //       deviceGroupToRegister,
    //       user.id,
    //       user.blockchainAccountAddress
    //     );

    //   } else {

    //     throw new ConflictException({
    //       success: false,
    //       message: 'No blockchain address sent and no blockchain address attached to this account',
    //     });
    //   }
    // }

  }



  /**
   * It is POST api to create device group
   * @param user from user request
   * @param param1 is getting organizationId from loggedIn user
   * @param fileToProcess uploaded csv file
   * @returns {DeviceCsvFileProcessingJobsEntity}
   */
  @Post('process-creation-bulk-devices-csv')
  @UseGuards(AuthGuard('jwt'))
  //@UseGuards(AuthGuard('jwt'), PermissionGuard)
  //@Permission('Write')
  //@ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  //@Roles(Role.Admin, Role.DeviceOwner,Role.OrganizationAdmin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceCsvFileProcessingJobsEntity],
    description: 'Returns created devices from csv',
  })
  @ApiBody({ type: CSVBulkUploadDTO })
  public async processCreationBulkFromCSV
    (@UserDecorator() user: ILoggedInUser,
      @UserDecorator() { organizationId }: ILoggedInUser,
      @Body() fileToProcess: CSVBulkUploadDTO): Promise<DeviceCsvFileProcessingJobsEntity> {
    if (user.organizationId === null || user.organizationId === undefined) {
      throw new ConflictException({
        success: false,
        message:
          'User needs to have organization added'
      })
    }

    //let response:any = await this.fileService.GetuploadS3(fileToProcess.fileName);
    // let response = await this.fileService.get(fileToProcess.fileName, user);


    console.log(fileToProcess.fileName);
    if (fileToProcess.fileName == undefined) {
      //throw new Error("file not found");
      throw new ConflictException({
        success: false,
        message:
          'File Not Found'
      })

    }
    if (!fileToProcess.fileName.endsWith('.csv')) {
      //throw new Error("file not found");
      throw new ConflictException({
        success: false,
        message:
          'Invalid file'
      })

    }
    let jobCreated = await this.deviceGroupService.createCSVJobForFile(user.id, organizationId, StatusCSV.Added, fileToProcess.fileName);

    //let jobCreated = await this.deviceGroupService.createCSVJobForFile(user.id, organizationId, StatusCSV.Added,  response.filename);

    return jobCreated;
  }

  /**
   * It is PATCH api to update device group by id
   * @param id  is identifier of device group in type number 
   * @param loggedUser user from request
   * @param groupToUpdate body payload to update an device group
   * @returns 
   */
  @Patch('/:id')
  @UseGuards(AuthGuard('jwt'))
  // @Roles(Role.DeviceOwner, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: NewUpdateDeviceGroupDTO,
    description: 'Returns an updated Device Group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  public async update(
    @Param('id') id: number,
    @UserDecorator() loggedUser: ILoggedInUser,
    @Body() groupToUpdate: NewUpdateDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {

    let devicenextissuence: DeviceGroupNextIssueCertificate | null = await this.deviceGroupService.getGroupiCertificateIssueDate({ groupId: id });
    if (devicenextissuence === null) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `This device groups reservation has already ended `,
          })
        );
      });
    }
    if (new Date(groupToUpdate.reservationEndDate).getTime() < new Date(devicenextissuence.start_date).getTime()) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Certificates are already generated or in progress for device group, cannot reduce below start time:${devicenextissuence.start_date}`,
          })
        );
      });
    }

    return await this.deviceGroupService.update(
      id,
      loggedUser,
      groupToUpdate,
    );
  }

  /**
   * It is DELETE api to delete an device group by id.
   * @param id is unique identifier of device group in type number
   * @param param1 is getting organizationId from loggedIn user
   * @returns {void}
   */
  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin,Role.Buyer,Role.SubBuyer)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remove device group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  public async remove(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<void> {
    return await this.deviceGroupService.remove(id, organizationId);
  }

  /**
   * It is GET api to list the status of jobs
   * @param jobId is unique identifier of jobId
   * @param param1 organizationId from loggedIn User
   * @returns {JobFailedRowsDTO | undefined}
   */
  @Get('/bulk-upload-status/:id')
  @UseGuards(AuthGuard('jwt'))//, PermissionGuard)
  // @Permission('Read')
  // @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: JobFailedRowsDTO,
    description: 'Returns status of job id for bulk upload',
  })
  public async getBulkUploadJobStatus(
    @Param('id') jobId: number,
    @UserDecorator() { organizationId }: ILoggedInUser
  ): Promise<JobFailedRowsDTO | undefined> {
    console.log("jobId", jobId);

    let data = await this.deviceGroupService.getFailedRowDetailsForCSVJob(
      jobId
    );
    console.log("data", data);
    return await this.deviceGroupService.getFailedRowDetailsForCSVJob(
      jobId
    );
  }

  /**
   * It is GET api to list all jobs by organization
   * @param user is user from request
   * @param param1 is getting organization Id from user request
   * @returns {Array<DeviceCsvFileProcessingJobsEntity>}
   */
  @Get('/bulk-upload/get-all-csv-jobs-of-organization')
  @UseGuards(AuthGuard('jwt'))
  //@UseGuards(AuthGuard('jwt'),PermissionGuard)
  //@Permission('Read')
  //@ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceCsvFileProcessingJobsEntity],
    description: 'Returns created jobs of an organization',
  })
  public async getAllCsvJobsBelongingToOrganization(
    @UserDecorator() user: ILoggedInUser, @UserDecorator() { organizationId }: ILoggedInUser): Promise<Array<DeviceCsvFileProcessingJobsEntity>> {
    console.log("user", user);
    console.log("organization", organizationId);

    if (user.organizationId === null || user.organizationId === undefined) {
      throw new ConflictException({
        success: false,
        message:
          'User needs to have organization added'
      })
    }
    if(user.role==='Admin'){
      return this.deviceGroupService.getAllCSVJobsForAdmin();
    }
    return this.deviceGroupService.getAllCSVJobsForOrganization(organizationId);
  }

  /**
   * It is GET api to fetch an certificate log of an device
   * @param id is unique identifier of device group
   * @returns {CheckCertificateIssueDateLogForDeviceGroupEntity}
   */
  @Get('certificatelog/:id')
  @ApiOkResponse({
    type: DeviceGroupDTO,
    description: 'Returns a Device group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  async getdevciegrouplog(@Param('id') id: number): Promise<CheckCertificateIssueDateLogForDeviceGroupEntity[] | null> {
    return this.deviceGroupService.getDeviceGrouplog(id);
  }
  //   @Post('/buyer-reservation')
  //   @UseGuards(AuthGuard('jwt'),PermissionGuard)
  //   @Permission('Write')
  //   @ACLModules('DEVICE_BUYER_RESERVATION_MANAGEMENT_CRUDL')
  //   @ApiResponse({
  //    status: HttpStatus.OK,
  //    type: JobFailedRowsDTO,
  //    description: 'Returns status of job id for bulk upload',
  //  })
  //  public async createBuyerReservationGroups(
  //    @UserDecorator() { organizationId }: ILoggedInUser
  //  ): Promise<JobFailedRowsDTO | undefined> {

  //  }

  /**
   * It is DELETE api to delete an device reservation
   * @param id is unique identifier of an device group
   * @param endresavationdate is date of end reservation
   * @param param2 is getting organization Id of loggedIn user
   * @returns {void}
   */
  @Delete('endreservation/:id')
  @UseGuards(AuthGuard('jwt'))

  @ApiResponse({
    status: HttpStatus.OK,
    type: EndReservationdateDTO,
    description: 'Reservation End',
  })
  @ApiNotFoundResponse({ description: `No  Reservation found` })
  public async endresavation(
    @Param('id') id: number,
    @Body() endresavationdate: EndReservationdateDTO,
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<void> {
    return await this.deviceGroupService.EndReservationGroup(id, organizationId, endresavationdate);
  }

  /**
   * It is GET api to fetch current information of reservation
   * @param groupuId is an identifier of device
   * @param param1 
   * @returns {any}
   */
  @Get('current-information/:groupUid')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: HttpStatus.OK
  })
  public async getReservationcurrentinformation(
    @Param('groupUid') groupuId: string,
    @UserDecorator() { organizationId }: ILoggedInUser
  ): Promise<any> {
    console.log("jobId", groupuId);
    const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
    if (groupuId === null || !regexExp.test(groupuId)) {
      return new Promise((resolve, reject) => {
        reject(new ConflictException({
          success: false,
          message: ' Please Add the valid UID ,invalid group uid value was sent',
        }))
      })
    }
    // const devicegroup = await this.deviceGroupService.findOne({ devicegroup_uid: groupuId })
    // if (devicegroup === null || devicegroup.buyerId != user.id) {
    //     return new Promise((resolve, reject) => {
    //         reject(new ConflictException({
    //             success: false,
    //             message: 'Group UId is not of this buyer, invalid value was sent',
    //         }))
    //     })
    // }


    return await this.deviceGroupService.getcurrentInformationofDevicesInReservation(
      groupuId
    );
  }
}
