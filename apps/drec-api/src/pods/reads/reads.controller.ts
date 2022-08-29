import {
  AggregateFilterDTO,
  BaseReadsController,
  FilterDTO,
  AggregatedReadDTO,
  ReadDTO,
  ReadsService as BaseReadsService,
  MeasurementDTO,
} from '@energyweb/energy-api-influxdb';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  ConflictException
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BASE_READ_SERVICE } from './const';
import { ReadsService } from './reads.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../../guards/RolesGuard';
import { Role } from '../../utils/enums';
import {NewIntmediateMeterReadDTO} from '../reads/dto/intermediate_meter_read.dto'
import { Device, DeviceService } from '../device';

import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { DeviceDTO } from '../device/dto';
@Controller('meter-reads')
@ApiBearerAuth('access-token')
@ApiTags('meter-reads')
export class ReadsController extends BaseReadsController {
  constructor(
    private internalReadsService: ReadsService,
    private deviceService: DeviceService,
    @Inject(BASE_READ_SERVICE)
    baseReadsService: BaseReadsService,
  ) {
    super(baseReadsService);
  }

  @Get('/:meter')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ReadDTO],
    description: 'Returns time-series of meter reads',
  })
  @UseGuards(AuthGuard('jwt'))
  public async getReads(
    @Param('meter') meterId: string,
    @Query() filter: FilterDTO,
  ): Promise<ReadDTO[]> {
    return super.getReads(meterId, filter);
  }

  @Get('/:meter/difference')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ReadDTO],
    description:
      'Returns time-series of difference between subsequent meter reads',
  })
  @UseGuards(AuthGuard('jwt'))
  public async getReadsDifference(
    @Param('meter') meterId: string,
    @Query() filter: FilterDTO,
  ): Promise<ReadDTO[]> {
    return super.getReadsDifference(meterId, filter);
  }

  @Get('group/:groupId/aggregate')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [AggregatedReadDTO],
    description:
      'Returns aggregated time-series of difference between subsequent meter reads',
  })
  public async getGroupAggregatedReads(
    @Param('groupId') groupId: number,
    @Query() filter: AggregateFilterDTO,
  ): Promise<AggregatedReadDTO[]> {
    return this.internalReadsService.getGroupAggregatedReads(groupId, filter);
  }

  @Get('/:meter/aggregate')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [AggregatedReadDTO],
    description:
      'Returns aggregated time-series of difference between subsequent meter reads',
  })
  public async getReadsAggregates(
    @Param('meter') meterId: string,
    @Query() filter: AggregateFilterDTO,
  ): Promise<AggregatedReadDTO[]> {
    return super.getReadsAggregates(meterId, filter);
  }

  @Post('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner,Role.OrganizationAdmin)
  public async storeReads(
    @Param('id') id: string,
    @Body() measurements: MeasurementDTO,
  ): Promise<void> {
    return await this.internalReadsService.storeRead(id, measurements);
  }
  @Post('new/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New meter reads for historical data, Delta readings and Aggregate Readings',
    type: [NewIntmediateMeterReadDTO],
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner,Role.OrganizationAdmin)
  public async newstoreRead(
    @Param('id') id: string,
    @Body() measurements: NewIntmediateMeterReadDTO,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<void> {
      let device:DeviceDTO|null = await this.deviceService.findReads(id);

      if(device === null)
      {
        
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:`Invalid device id`,
            })
          );
        });
      }
      if(device && device.organizationId !== user.organizationId)
      {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:`Device doesnt belongs to the requested users organization`,
            })
          );
        });
      }
      return await this.internalReadsService.newstoreRead(id, measurements);
  }
}
