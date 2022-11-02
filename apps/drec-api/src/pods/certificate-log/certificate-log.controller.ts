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
import {CheckCertificateIssueDateLogForDeviceEntity} from '../device/check_certificate_issue_date_log_for_device.entity'
import {CertificateLogService} from './certificate-log.service'
import {FilterDTO, GroupIDBasedFilteringDTO} from './dto/filter.dto'
@ApiTags('certificate-log')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/certificate-log')
export class CertificateLogController {

    constructor(
        private readonly certificateLogService: CertificateLogService,

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
        if(parseInt(filterDto.groupId) === NaN)
        {
            return new Promise((resolve, reject) => {
                reject(new ConflictException({
                  success: false,
                  message: 'Group Id is a number, invalid value was sent',
                }))
              })

        }
        return this.certificateLogService.findByGroupId(filterDto.groupId);
    }
}
