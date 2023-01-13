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
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity'
import { CertificateLogService } from './certificate-log.service'
import { FilterDTO, GroupIDBasedFilteringDTO } from './dto/filter.dto'
import { Certificate } from '@energyweb/issuer-api';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { DeviceGroupService } from '../device-group/device-group.service';
import { User } from '../user/user.entity';
import { CertificateWithPerdevicelog } from './dto'
@ApiTags('certificate-log')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/certificate-log')
export class CertificateLogController {

    constructor(
        private readonly certificateLogService: CertificateLogService,
        private readonly devicegroupService: DeviceGroupService,
    ) { }
    @Get()
    @UseGuards(AuthGuard('jwt'))

    @ApiOkResponse({ type: [CheckCertificateIssueDateLogForDeviceEntity], description: 'Returns all individual devices certificate log' })
    async getAll(
    ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
        return this.certificateLogService.find();
    }

    @Get('/by-reservation-groupId')
    @UseGuards(AuthGuard('jwt'))
    @ApiOkResponse({ type: [CheckCertificateIssueDateLogForDeviceEntity], description: 'Returns Certificate logs For individual devices based on groupId' })
    async getByGroupId(
        @Query(ValidationPipe) filterDto: GroupIDBasedFilteringDTO,
    ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
        if (parseInt(filterDto.groupId) === NaN) {
            return new Promise((resolve, reject) => {
                reject(new ConflictException({
                    success: false,
                    message: 'Group Id is a number, invalid value was sent',
                }))
            })

        }
        return this.certificateLogService.findByGroupId(filterDto.groupId);
    }
    @Get('/issuer/certified/:groupUid')
    @UseGuards(AuthGuard('jwt'))
    @ApiOkResponse({ type: [CertificateWithPerdevicelog], description: 'Returns issuer Certificate of groupId' })
    async getissueCertificate(
        @Param('groupUid') groupuId: string,
        @UserDecorator() user: ILoggedInUser,
    ): Promise<CertificateWithPerdevicelog[]> {
        const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
        console.log(regexExp.test(groupuId));
        if (groupuId === null || !regexExp.test(groupuId)) {
            return new Promise((resolve, reject) => {
                reject(new ConflictException({
                    success: false,
                    message: ' Please Add the valid UID ,invalid group uid value was sent',
                }))
            })
        }
        const devicegroup = await this.devicegroupService.findOne({ devicegroup_uid: groupuId })
        console.log("devicegroup");
        console.log(devicegroup);


        if (devicegroup === null || devicegroup.buyerId != user.id) {
            return new Promise((resolve, reject) => {
                reject(new ConflictException({
                    success: false,
                    message: 'Group UId is not of this buyer, invalid value was sent',
                }))
            })
        }

        return this.certificateLogService.getfindreservationcertified(devicegroup.id.toString());
    }

    @Get('/redemption-report')
    @UseGuards(AuthGuard('jwt'))
    @ApiOkResponse
        ({
            status: HttpStatus.OK,
            description: 'Returns a new created Device id'
        })
    async getRedemptionReport(
        @UserDecorator() { id }: ILoggedInUser,
    ): Promise<any[]> {
       return this.certificateLogService.getCertificateRedemptionReport(id);
    }
}
