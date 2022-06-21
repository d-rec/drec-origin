import {
  Controller,
  Get,
  Post,
  Patch,
  HttpStatus,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  Query,
  ConflictException,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';

import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { ActiveUserGuard } from '../../guards';
import { DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationService } from './developer_specific_group_device_only_for_managing_not_for_buyer_reservation.service';
import {
  CreateDeveloperDeviceGroupByDTO,
  DeveloperDeviceGroupByDTO,
} from './dto/developer-device-group-by.dto';
import { Device, DeviceService } from '../device';

@ApiTags('Developer Specific Group Device Not For Buyer Reservation')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('developer-specific-group-device-not-for-buyer-reservation')
export class DeveloperScecificGroupingDeviceNotForBuyerReservationController {
  constructor(
    private readonly developerSpecificDeviceGrouping: DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationService,
    private readonly deviceService: DeviceService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeveloperDeviceGroupByDTO,
    description: 'Returns a new created Developer Specific Device Groups',
  })
  public async create(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @UserDecorator() user: ILoggedInUser,
    @Body() devicesToGroup: DeveloperDeviceGroupByDTO,
  ): Promise<DeveloperDeviceGroupByDTO> {
    if (devicesToGroup.deviceIds) {
      const response: Array<Device> =
        await this.deviceService.findForDevicesWithDeviceIdAndOrganizationId(
          devicesToGroup.deviceIds,
          organizationId,
        );
      if (response.length != devicesToGroup.deviceIds.length) {
        const invalidDeviceIds = devicesToGroup.deviceIds.filter(
          (ids) => !response.find((singleDevice) => singleDevice.id === ids),
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                'One or more devices are invalid: deviceIds:' +
                invalidDeviceIds.join(','),
            }),
          );
        });
      }

      const createNewDeviceGroup: DeveloperDeviceGroupByDTO = {
        name: devicesToGroup.name,
        groupedByUserId: user.id,
        organizationId: organizationId,
        deviceIds: devicesToGroup.deviceIds,
      };

      this.developerSpecificDeviceGrouping.createDeveloperSpecificDeviceGroups(
        createNewDeviceGroup,
      );

      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:
              'This Device Group already has buyer added device cannot be added to device group',
          }),
        );
      });
    }
    return new Promise((resolve, reject) => {
      reject(
        new ConflictException({
          success: false,
          message:
            'This Device Group already has buyer added device cannot be added to device group',
        }),
      );
    });
  }
}
