import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { DeviceGroupService } from './device-group.service';
import {
  AddGroupDTO,
  DeviceGroupDTO,
  EndReservationDateDTO,
  NewUpdateDeviceGroupDTO,
  ResponseDeviceGroupDTO,
  UnreservedDeviceGroupsFilterDTO,
} from './dto';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { FileService } from '../file';

import { parse } from 'csv-parse';
import csv from 'csv-parser';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { DeviceGroupNextIssueCertificate } from './device_group_issuecertificate.entity';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from './check_certificate_issue_date_log_for_device_group.entity';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { DeviceService } from '../device/device.service';
import {
  checkOrganizationAndUser,
  isDeviceGroupable,
  validateDeviceGroupToRegister,
  validateDevicesAreHomogeneous,
} from '../../validations/device-group';
import { SMALL_DEVICES_MAX_CAPACITY } from '../../constants';

@ApiTags('Buyer Reservation')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/buyer-reservation')
export class BuyerReservationController {
  private readonly logger = new Logger(BuyerReservationController.name);

  csvParser = csv({ separator: ',' });

  parser = parse({
    delimiter: ',',
  });
  constructor(
    private readonly deviceGroupService: DeviceGroupService,
    private readonly fileService: FileService,
    private organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly deviceService: DeviceService,
  ) {}

  /**
   * It is GET api to list all device group in reservation data
   * @returns {Array<DeviceGroupDTO>}
   */
  @Get()
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    RolesGuard,
    PermissionGuard,
  )
  @ACLModules('DEVICE_GROUPING_MANAGEMENT_CRUDL')
  @Permission('Read')
  @Roles(Role.Admin, Role.ApiUser, Role.OrganizationAdmin)
  @ApiQuery({
    name: 'organizationId',
    type: Number,
    required: false,
    description: 'This query parameter is used for Apiuser',
  })
  @ApiQuery({
    name: 'apiUserId',
    type: String,
    required: false,
    description:
      'This query parameter is used for Admin to list the reservations by ApiUser',
  })
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOkResponse({
    type: [DeviceGroupDTO],
    description: 'Returns all Device groups',
  })
  @ApiOperation({
    summary: 'Retrieve all buyer reservations',
    description: 'Fetch a list of all buyer reservations available.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Successfully retrieved all buyer reservations.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view buyer reservations.',
  })
  async getAll(
    @UserDecorator() user: ILoggedInUser,
    @Query('organizationId', new DefaultValuePipe(null))
    organizationId: number | null,
    @Query('apiUserId', new DefaultValuePipe(null)) apiUserId: string | null,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    filterDTO: UnreservedDeviceGroupsFilterDTO,
  ): Promise<
    | {
        devicegroups: DeviceGroupDTO[];
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
    | DeviceGroupDTO[]
  > {
    this.logger.verbose('With in getAll');
    let organization: any;
    if (!apiUserId) {
      apiUserId = user.api_user_id;
    }

    if (organizationId) {
      organization = await this.organizationService.findOne(organizationId);
      if (user.role === Role.ApiUser) {
        if (organization.api_user_id != user.api_user_id) {
          this.logger.error(
            `Organization requested is belongs to other apiuser`,
          );
          throw new BadRequestException({
            success: false,
            message: 'Organization requested is belongs to other apiuser',
          });
        }
      }
    }

    if (apiUserId) {
      if (user.role === Role.ApiUser) {
        if (apiUserId != user.api_user_id) {
          this.logger.error(
            `An apiuser is unauthorized to request for other apiuser`,
          );
          throw new UnauthorizedException({
            success: false,
            message: 'An apiuser is unauthorized to request for other apiuser',
          });
        }
      }

      if (organizationId && apiUserId != organization.api_user_id) {
        this.logger.error(
          `The requested organization is not belongs to the apiuser`,
        );
        throw new UnauthorizedException({
          success: false,
          message: 'The requested organization is not belongs to the apiuser',
        });
      }
    }
    return this.deviceGroupService.getAll(
      user,
      organizationId,
      apiUserId,
      pageNumber,
      limit,
      filterDTO,
    );
  }

  /**
   * It is GET api to list all device groups of loggedIn user
   * @param param0 is getting userId, organizationId and user role from user at request
   * @param filterDTO is filteration fields to retrieve records
   * @param pageNumber is for pagination
   * @returns {Array<DeviceGroupDTO>}
   */
  @Get('/my')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard)
  //@Roles(Role.OrganizationAdmin, Role.DeviceOwner, Role.Buyer,Role.SubBuyer)
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiOperation({
    summary: 'Fetch my reservations',
    description:
      'Retrieve buyer reservations associated with the logged-in user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description:
      'Successfully retrieved buyer reservations associated with the user.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view buyer reservations.',
  })
  async getMyDevices(
    @UserDecorator() user: ILoggedInUser,
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    filterDTO: UnreservedDeviceGroupsFilterDTO,

    @Query('pagenumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ): Promise<
    | {
        devicegroups: DeviceGroupDTO[];
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
    | DeviceGroupDTO[]
  > {
    this.logger.verbose(`With in getMyDevices`);
    const { organizationId, role } = user;
    switch (role) {
      case Role.DeviceOwner:
        return await this.deviceGroupService.getOrganizationDeviceGroups(
          organizationId,
        );
      case Role.Buyer:
        return await this.deviceGroupService.getDeviceGroups(
          organizationId,
          pageNumber,
          filterDTO,
        );
      case Role.SubBuyer:
        return await this.deviceGroupService.getDeviceGroups(
          organizationId,
          pageNumber,
          filterDTO,
        );
      case Role.OrganizationAdmin:
        return await this.deviceGroupService.getAll(
          user,
          organizationId,
          user.api_user_id,
          pageNumber,
          limit,
          filterDTO,
        );
      default:
        return await this.deviceGroupService.getOrganizationDeviceGroups(
          organizationId,
        );
    }
  }

  /**
   * It is GET api to fetch device group by id
   * @param id is unique identifier of device groupId
   * @returns {DeviceGroupDTO | null} DeviceGroupDTO is when the record found, returns null when the record not found by id
   */
  @Get('/:id')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('DEVICE_GROUPING_MANAGEMENT_CRUDL')
  @ApiQuery({
    name: 'organizationId',
    type: Number,
    required: false,
    description: 'This query parameter is used for Apiuser',
  })
  @ApiOperation({
    summary: 'Fetch buyer reservation by ID',
    description:
      'Retrieve a specific buyer reservation using its ID. Optionally filter by organization ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Successfully retrieved the buyer reservation.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No buyer reservation found with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have permission to view this buyer reservation.',
  })
  async get(
    @Param('id') id: number,
    @Query('organizationId', new DefaultValuePipe(null))
    organizationId: number | null,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<DeviceGroupDTO | null> {
    this.logger.verbose(`With in get`);
    if (organizationId) {
      const organization =
        await this.organizationService.findOne(organizationId);
      if (user.role === Role.ApiUser) {
        if (user.api_user_id != organization.api_user_id) {
          this.logger.error(
            `Organization requested is belongs to other apiuser`,
          );
          throw new BadRequestException({
            success: false,
            message: 'Organization requested is belongs to other apiuser',
          });
        } else {
          user.organizationId = organizationId;
        }
      } else {
        if (organizationId != user.organizationId) {
          this.logger.error(
            `Organization requested is not same as logged in user organization`,
          );
          throw new BadRequestException({
            success: false,
            message:
              'Organization requested is not same as logged in user organization',
          });
        }
      }
    }
    return this.deviceGroupService.findById(id, user);
  }

  /**
   * It is POSTb api to create an device group
   * @param param0 is getting organization Id from user request
   * @param user is getting uset from user request
   * @param deviceGroupToRegister body payload to create device group
   * @returns {ResponseDeviceGroupDTO | null}
   */
  @Post()
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']), RolesGuard)
  // @Roles(Role.DeviceOwner, Role.Admin,Role.Buyer)
  @Roles(Role.ApiUser, Role.OrganizationAdmin, Role.Admin)
  @ApiQuery({
    name: 'orgId',
    type: Number,
    required: false,
    description: 'This query parameter is used for Apiuser',
  })
  @ApiOperation({
    summary: 'Create a new buyer reservation',
    description: 'Register a new buyer reservation in the system.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: DeviceGroupDTO,
    description: 'Successfully created the buyer reservation.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The provided data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to create buyer reservations.',
  })
  public async createOne(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @UserDecorator() user: ILoggedInUser,
    @Body() deviceGroupToRegister: AddGroupDTO,
    @Query('orgId') orgId: number | null,
  ): Promise<ResponseDeviceGroupDTO | null> {
    this.logger.verbose(`With in createOne`);
    deviceGroupToRegister.api_user_id = user.api_user_id;
    const devices = await this.deviceService.findByIds(
      deviceGroupToRegister.deviceIds,
    );

    organizationId = await checkOrganizationAndUser(
      orgId,
      user,
      organizationId,
      this.organizationService,
      this.userService,
    );
    isDeviceGroupable(devices, organizationId);

    const totalCapacity = devices.reduce(
      (acc, device) => acc + device.capacity,
      0,
    );
    if (totalCapacity > SMALL_DEVICES_MAX_CAPACITY) {
      throw new ConflictException({
        success: false,
        message: `Total capacity of devices in the group cannot exceed ${SMALL_DEVICES_MAX_CAPACITY}KW`,
      });
    }

    validateDevicesAreHomogeneous(devices);
    validateDeviceGroupToRegister(deviceGroupToRegister, organizationId);
    return await this.deviceGroupService.createOne(
      organizationId,
      deviceGroupToRegister,
      user.id,
      process.env.DREC_BLOCKCHAIN_ADDRESS,
    );
  }

  @Post('pathway')
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']), RolesGuard)
  @Roles(Role.ApiUser, Role.OrganizationAdmin, Role.Admin)
  @ApiQuery({
    name: 'orgId',
    type: Number,
    required: false,
    description: 'This query parameter is used for Apiuser',
  })
  @ApiOperation({
    summary: 'Create single device pathway',
    description: 'Register a new single device pathway in the system.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: DeviceGroupDTO,
    description: 'Successfully created the single device pathway.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The provided data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have permission to create single device pathways.',
  })
  public async storeSingleDevicePathway(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @UserDecorator() user: ILoggedInUser,
    @Body() deviceGroupToRegister: AddGroupDTO,
    @Query('orgId') orgId: number | null,
  ): Promise<ResponseDeviceGroupDTO | null> {
    deviceGroupToRegister.api_user_id = user.api_user_id;
    organizationId = await checkOrganizationAndUser(
      orgId,
      user,
      organizationId,
      this.organizationService,
      this.userService,
    );
    if (deviceGroupToRegister.deviceIds.length !== 1) {
      throw new BadRequestException({
        success: false,
        message: 'Only one device can be added in single device pathway',
      });
    }
    validateDeviceGroupToRegister(deviceGroupToRegister, organizationId);
    return await this.deviceGroupService.createOne(
      organizationId,
      deviceGroupToRegister,
      user.id,
      process.env.DREC_BLOCKCHAIN_ADDRESS,
    );
  }

  /**
   * It is PATCH api to update device group by id
   * @param id  is identifier of device group in type number
   * @param loggedUser user from request
   * @param groupToUpdate body payload to update an device group
   * @returns
   */
  @Patch('/:id')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiOperation({
    summary: 'Update buyer reservation by ID',
    description: 'Modify an existing buyer reservation using its ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: NewUpdateDeviceGroupDTO,
    description: 'Successfully updated the buyer reservation.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No buyer reservation found with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The provided data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have permission to update this buyer reservation.',
  })
  public async update(
    @Param('id') id: number,
    @UserDecorator() loggedUser: ILoggedInUser,
    @Body() groupToUpdate: NewUpdateDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {
    this.logger.verbose(`With in update`);
    const deviceNextIssuance: DeviceGroupNextIssueCertificate | null =
      await this.deviceGroupService.getGroupCertificateIssueDate({
        groupId: id,
      });
    if (deviceNextIssuance === null) {
      this.logger.error(`This device groups reservation has already ended`);
      throw new ConflictException({
        success: false,
        message: `This device groups reservation has already ended `,
      });
    }
    if (
      new Date(groupToUpdate.reservationEndDate).getTime() <
      new Date(deviceNextIssuance.start_date).getTime()
    ) {
      this.logger.error(
        `Certificates are already generated or in progress for device group, cannot reduce below start time:${deviceNextIssuance.start_date}`,
      );
      throw new ConflictException({
        success: false,
        message: `Certificates are already generated or in progress for device group, cannot reduce below start time:${deviceNextIssuance.start_date}`,
      });
    }

    return await this.deviceGroupService.update(id, loggedUser, groupToUpdate);
  }

  /**
   * It is DELETE api to delete an device group by id.
   * @param id is unique identifier of device group in type number
   * @param param1 is getting organizationId from loggedIn user
   * @returns {void}
   */
  @Delete('/:id')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin, Role.Buyer, Role.SubBuyer)
  @ApiOperation({
    summary: 'Remove buyer reservation by ID',
    description: 'Delete a buyer reservation using its ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully removed the buyer reservation.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No buyer reservation found with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have permission to delete this buyer reservation.',
  })
  public async remove(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<void> {
    this.logger.verbose(`With in remove`);
    return await this.deviceGroupService.remove(id, organizationId);
  }

  /**
   * It is GET api to fetch an certificate log of an device
   * @param id is unique identifier of device group
   * @returns {CheckCertificateIssueDateLogForDeviceGroupEntity}
   */
  @Get('certificatelog/:id')
  @ApiOperation({
    summary: 'Fetch certificate log for a device using its ID',
    description:
      'This log contains details about the issuance of certificates related to the device group, which can be useful for tracking and auditing purposes in the context of buyer reservations.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description:
      'Successfully retrieved the certificate log for the device group.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No device group found with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view this certificate log.',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  async getDeviceGroupLog(
    @Param('id') id: number,
  ): Promise<CheckCertificateIssueDateLogForDeviceGroupEntity[] | null> {
    this.logger.verbose(`With in getdevicegrouplog`);
    return this.deviceGroupService.getDeviceGrouplog(id);
  }

  /**
   * It is DELETE api to delete an device reservation
   * @param id is unique identifier of an device group
   * @param endReservationDate is date of end reservation
   * @param param2 is getting organization Id of loggedIn user
   * @returns {void}
   */
  @Delete('endreservation/:id')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiOperation({
    summary: 'End reservation by ID',
    description:
      'Terminate a reservation for a specific buyer reservation using its ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: EndReservationDateDTO,
    description: 'Successfully ended the reservation.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No reservation found with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The provided data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to end this reservation.',
  })
  public async endReservation(
    @Param('id') id: number,
    @Body() endReservationDate: EndReservationDateDTO,
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<void> {
    this.logger.verbose(`With in endresavation`);
    return await this.deviceGroupService.endReservationGroup(
      id,
      organizationId,
      endReservationDate,
    );
  }

  /**
   * It is GET api to fetch current information of reservation
   * @param groupId is an identifier of device
   * @param pageNumber
   * @returns {any}
   */
  @Get('current-information/:groupUid')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiOperation({
    summary: 'Fetch current reservation information',
    description:
      'Retrieve current information of reservations for a specific buyer reservation using its ID.',
  })
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved current reservation information.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No reservation found with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have permission to view this reservation information.',
  })
  public async getReservationCurrentInformation(
    @Param('groupUid', ParseUUIDPipe) groupId: string,
    @Query('pagenumber') pageNumber: number,
  ): Promise<any> {
    this.logger.verbose(`With in getReservationCurrentInformation`);

    return await this.deviceGroupService.getCurrentInformationOfDevicesInReservation(
      groupId,
      pageNumber,
    );
  }
}
