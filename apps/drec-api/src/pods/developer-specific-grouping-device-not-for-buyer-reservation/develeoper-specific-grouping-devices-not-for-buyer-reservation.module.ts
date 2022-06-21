import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity } from './developer_specific_group_device_only_for_managing_not_for_buyer_reservation.entity';
import { DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationService } from './developer_specific_group_device_only_for_managing_not_for_buyer_reservation.service';
import { DeveloperScecificGroupingDeviceNotForBuyerReservationController } from './developer-specific-device-grouping-not-for-buyer-reservation.controller';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [
    forwardRef(() => DeviceModule),
    TypeOrmModule.forFeature([
      DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationEntity,
    ]),
  ],
  providers: [
    DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationService,
  ],
  exports: [
    DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationService,
  ],
  controllers: [
    DeveloperScecificGroupingDeviceNotForBuyerReservationController,
  ],
})
export class DeveloperScecificGroupingDeviceNotForBuyerReservationModule {}
