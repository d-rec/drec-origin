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
  ConflictException
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiBody,
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
  NewUpdateDeviceGroupDTO
} from './dto';
import { Roles } from '../user/decorators/roles.decorator';
import { Installation, OffTaker, Role, Sector, StandardCompliance } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { UserDecorator } from '../user/decorators/user.decorator';
import { DeviceDescription, ILoggedInUser } from '../../models';
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


@ApiTags('device-group')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/device-group')
export class DeviceGroupController {
  csvParser = csv({ separator: ',' });

  parser = parse({
    delimiter: ','
  });
  constructor(private readonly deviceGroupService: DeviceGroupService, private readonly fileService: FileService) { }

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

  @Get('/unreserved')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.Buyer)
  @ApiOkResponse({
    type: [SelectableDeviceGroupDTO],
    description: 'Returns all unreserved Device Groups',
  })
  async getUnreserved(
    @Query(ValidationPipe) filterDto: UnreservedDeviceGroupsFilterDTO,
  ): Promise<SelectableDeviceGroupDTO[]> {
    return this.deviceGroupService.getReservedOrUnreserved(filterDto);
  }

  @Get('/reserved')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.Buyer)
  @ApiOkResponse({
    type: [SelectableDeviceGroupDTO],
    description: 'Returns all reserved Device Groups',
  })
  async getReserved(
    @UserDecorator() { id }: ILoggedInUser,
    @Query(ValidationPipe) filterDto: UnreservedDeviceGroupsFilterDTO,
  ): Promise<SelectableDeviceGroupDTO[]> {
    return this.deviceGroupService.getReservedOrUnreserved(filterDto, id);
  }

  @Get('/my')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.OrganizationAdmin, Role.DeviceOwner, Role.Buyer)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns my Device groups',
  })
  async getMyDevices(
    @UserDecorator() { id, organizationId, role }: ILoggedInUser,
  ): Promise<DeviceGroupDTO[]> {
    switch (role) {
      case Role.DeviceOwner:
        return await this.deviceGroupService.getOrganizationDeviceGroups(
          organizationId,
        );
      case Role.Buyer:
        return await this.deviceGroupService.getBuyerDeviceGroups(id);
      case Role.OrganizationAdmin:
        return await this.deviceGroupService.getAll();
      default:
        return await this.deviceGroupService.getOrganizationDeviceGroups(
          organizationId,
        );
    }
  }

  @Get('/:id')
  @ApiOkResponse({
    type: DeviceGroupDTO,
    description: 'Returns a Device group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  async get(@Param('id') id: number): Promise<DeviceGroupDTO | null> {
    return this.deviceGroupService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))//, RolesGuard)
  // @Roles(Role.DeviceOwner, Role.Admin,Role.Buyer)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async createOne(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @UserDecorator() user: ILoggedInUser,
    @Body() deviceGroupToRegister: AddGroupDTO,
  ): Promise<DeviceGroupDTO | null> {
    console.log("user", user);
    if (organizationId === null || organizationId === undefined) {
      throw new ConflictException({
        success: false,
        message: 'User does not has organization associated',
      });
    }
    if (user.blockchainAccountAddress !== null && user.blockchainAccountAddress !== undefined) {
      return await this.deviceGroupService.createOne(
        organizationId,
        deviceGroupToRegister,
        user.id,
        user.blockchainAccountAddress
      );
    }
    else {
      throw new ConflictException({
        success: false,
        message: 'Blockchain address is not added for this organization',
      });
    }

  }



  @Post('multiple')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns a new created Device group',
  })
  @ApiBody({ type: [AddGroupDTO] })
  public async createMultiple(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceGroupsToRegister: AddGroupDTO[],
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.createMultiple(
      organizationId,
      deviceGroupsToRegister,
    );
  }

  @Post('bulk-devices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns auto-created device groups',
  })
  @ApiBody({ type: [NewDeviceDTO] })
  public async createBulk(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() devicesToRegister: NewDeviceDTO[],
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.registerBulkDevices(
      organizationId,
      devicesToRegister,
    );
  }




  @Post('process-creation-bulk-devices-csv')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  //@Roles(Role.Admin, Role.DeviceOwner,Role.OrganizationAdmin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceCsvFileProcessingJobsEntity],
    description: 'Returns created devices from csv',
  })
  @ApiBody({ type: CSVBulkUploadDTO })
  public async processCreationBulkFromCSV(@UserDecorator() user: ILoggedInUser, @UserDecorator() { organizationId }: ILoggedInUser, @Body() fileToProcess: CSVBulkUploadDTO): Promise<DeviceCsvFileProcessingJobsEntity> {
    if (user.organizationId === null || user.organizationId === undefined) {
      throw new ConflictException({
        success: false,
        message:
          'User needs to have organization added'
      })
    }
    let response = await this.fileService.get(fileToProcess.fileName, user);
    if (response == undefined) {
      //throw new Error("file not found");
      throw new ConflictException({
        success: false,
        message:
          'File Not Found'
      })

    }
    if (!response.filename.endsWith('.csv')) {
      //throw new Error("file not found");
      throw new ConflictException({
        success: false,
        message:
          'Invalid file'
      })

    }
    let jobCreated = await this.deviceGroupService.createCSVJobForFile(user.id, organizationId, StatusCSV.Added, response instanceof File ? response.id : '');

    return jobCreated;
  }
  @Post('/reserve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Buyer)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns a new created Device group',
  })
  public async reserve(
    @UserDecorator()
    { id, blockchainAccountAddress }: ILoggedInUser,
    @Body() ids: ReserveGroupsDTO,
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.reserveGroup(
      ids,
      id,
      blockchainAccountAddress,
    );
  }

  @Post('/unreserve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Buyer)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Unreserves device groups from buyer',
  })
  public async unreserve(
    @UserDecorator()
    { id }: ILoggedInUser,
    @Body() ids: ReserveGroupsDTO,
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.unreserveGroup(ids, id);
  }
  @Post('/add/:id')
  @UseGuards(AuthGuard('jwt'))
  //@Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async addDevices(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceIds: DeviceIdsDTO,
  ): Promise<DeviceGroupDTO | void> {
    return await this.deviceGroupService.addDevices(
      id,
      organizationId,
      deviceIds,
    );
  }

  @Post('/remove/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async removeDevices(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceIds: DeviceIdsDTO,
  ): Promise<DeviceGroupDTO | void> {
    return await this.deviceGroupService.removeDevices(
      id,
      organizationId,
      deviceIds,
    );
  }

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
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() groupToUpdate: NewUpdateDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {


    let devicenextissuence: DeviceGroupNextIssueCertificate | null = await this.deviceGroupService.getGroupiCertificateIssueDate({groupId:id});
    if (devicenextissuence === null) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:`This device groups reservation has already ended `,
          })
        );
      });
    }
    if (new Date(groupToUpdate.reservationEndDate).getTime() < new Date(devicenextissuence.start_date).getTime()) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:`Certificates are already generated or in progress for device group, cannot reduce below start time:${devicenextissuence.start_date}`,
          })
        );
      });
    }
  
    return await this.deviceGroupService.update(
    id,
    organizationId,
    groupToUpdate,
  );
  }

@Delete('/:id')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.DeviceOwner, Role.Admin)
@ApiResponse({
  status: HttpStatus.OK,
  description: 'Remove device group',
})
@ApiNotFoundResponse({ description: `No device group found` })
public async remove(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise < void> {
  return await this.deviceGroupService.remove(id, organizationId);
}

@Get('/bulk-upload-status/:id')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@Permission('Read')
@ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
@ApiResponse({
  status: HttpStatus.OK,
  type: JobFailedRowsDTO,
  description: 'Returns status of job id for bulk upload',
})
public async getBulkUploadJobStatus(
    @Param('id') jobId: number,
    @UserDecorator() { organizationId }: ILoggedInUser
  ): Promise < JobFailedRowsDTO | undefined > {
  console.log("jobId", jobId);

  let data = await this.deviceGroupService.getFailedRowDetailsForCSVJob(
    jobId
  );
  console.log("data", data);
  return await this.deviceGroupService.getFailedRowDetailsForCSVJob(
    jobId
  );
}

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
public async getAllCsvJobsBelongingToOrganization(@UserDecorator() user: ILoggedInUser, @UserDecorator() { organizationId }: ILoggedInUser): Promise < Array < DeviceCsvFileProcessingJobsEntity >> {
  console.log("user", user);
  console.log("organization", organizationId);

  if(user.organizationId === null || user.organizationId === undefined) {
  throw new ConflictException({
    success: false,
    message:
      'User needs to have organization added'
  })
}
return this.deviceGroupService.getAllCSVJobsForOrganization(organizationId);
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
@Delete('endresavation/:id')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.DeviceOwner, Role.Admin)
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
  ): Promise < void> {
  return await this.deviceGroupService.EndReservationGroup(id, organizationId, endresavationdate);
}
}
