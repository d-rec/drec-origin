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
import {FilterDTO} from './dto/filter.dto'
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
 
    @ApiOkResponse({ type: [CheckCertificateIssueDateLogForDeviceEntity], description: 'Returns all Devices certificate log' })
    async getAll(
        @Query(ValidationPipe) filterDto: FilterDTO,
    ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
        return this.certificateLogService.Findcertificatelog(filterDto);
    }
}
