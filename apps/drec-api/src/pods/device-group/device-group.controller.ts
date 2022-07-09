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



@ApiTags('device-group')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/device-group')
export class DeviceGroupController {
  csvParser = csv({ separator: ',' });

  parser = parse({
    delimiter: ','
  });
  constructor(private readonly deviceGroupService: DeviceGroupService, private readonly fileService:FileService) {}

  @Get()
  @ApiOkResponse({
    type: [DeviceGroupDTO],
    description: 'Returns all Device groups',
  })
  async getAll(): Promise<DeviceGroupDTO[]> {
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async createOne(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceGroupToRegister: AddGroupDTO,
  ): Promise<DeviceGroupDTO | null> {
    return await this.deviceGroupService.createOne(
      organizationId,
      deviceGroupToRegister,
    );
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
  @Roles(Role.Admin, Role.DeviceOwner)
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
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.DeviceOwner,Role.OrganizationAdmin)
    @ApiResponse({
      status: HttpStatus.OK,
      type: [DeviceCsvFileProcessingJobsEntity],
      description: 'Returns created devices from csv',
    })
    @ApiBody({ type: CSVBulkUploadDTO})
    public async processCreationBulkFromCSV(@UserDecorator() user: ILoggedInUser,@UserDecorator() { organizationId }: ILoggedInUser,  @Body() fileToProcess: CSVBulkUploadDTO): Promise<DeviceCsvFileProcessingJobsEntity> {
      let response =  await this.fileService.get(fileToProcess.fileName,user);
      if(response == undefined)
      {
        throw new Error("file not found");

      }
      let jobCreated=await this.deviceGroupService.createCSVJobForFile(user.id,organizationId,StatusCSV.Added,response instanceof File? response.id:'');
      
      return jobCreated;
    }

  @Post('/add/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateDeviceGroupDTO,
    description: 'Returns an updated Device Group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  public async update(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() groupToUpdate: UpdateDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {
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
  ): Promise<void> {
    return await this.deviceGroupService.remove(id, organizationId);
  }

  @Get('/bulk-upload-status/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    type: JobFailedRowsDTO,
    description: 'Returns status of job id for bulk upload',
  })
  public async getBulkUploadJobStatus(
    @Param('id') jobId: number,
    @UserDecorator() { organizationId }: ILoggedInUser
  ): Promise<JobFailedRowsDTO | undefined> {
    return await this.deviceGroupService.getFailedRowDetailsForCSVJob(
      jobId
    );
  }
}
