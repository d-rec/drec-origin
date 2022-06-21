import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationModel } from '../../models/DeveloperGrouingDeviceOnlyForManagerialPurposeNotBuyerReservation';

import { DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity } from './developer_specific_group_device_only_for_managing_not_for_buyer_reservation.entity';
import { DeveloperDeviceGroupByDTO } from './dto/developer-device-group-by.dto';

@Injectable()
export class DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationService {
  private readonly logger = new Logger(
    DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationService.name,
  );

  constructor(
    @InjectRepository(
      DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity,
    )
    private readonly repository: Repository<DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity>,
  ) {}

  public async findForGroup(
    groupId: number,
  ): Promise<
    DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity[]
  > {
    return this.repository.find({
      where: { id: groupId },
    });
  }

  async getOrganizationDeviceGroupIdsGroupedByDeveloper(
    organizationId: number,
  ): Promise<
    DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity[]
  > {
    const devices = await this.repository.find({
      where: { organizationId },
    });

    return devices;
  }

  async createDeveloperSpecificDeviceGroups(
    data: DeveloperDeviceGroupByDTO,
  ): Promise<any> {
    const groupedDevices = await this.repository.save(
      new DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity(
        data,
      ),
    );
    return groupedDevices;
  }
}
