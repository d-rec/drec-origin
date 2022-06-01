

import {
    ClassSerializerInterceptor,
    BadRequestException,
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    ParseIntPipe,
    HttpStatus,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiResponse,
    ApiBody,
    ApiTags,
    ApiUnprocessableEntityResponse,
    ApiParam,
    ApiSecurity,
} from '@nestjs/swagger';
import { Role } from '../../utils/enums';
import { AccessControlLayerModuleServiceService } from './access-control-layer-module-service.service'
import { Expose } from 'class-transformer';
import { ACLModuleDTO, NewACLModuleDTO, UpdateACLModuleDTO } from './dto/aclmodule.dto'
import { ActiveUserGuard } from '../../guards';
import { Roles } from '../user/decorators/roles.decorator';
import { UserDecorator } from '../user/decorators/user.decorator';
import { RolesGuard } from '../../guards/RolesGuard';
@ApiTags('aclmoduleservices')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('access-control-layer-module-service')
export class AccessControlLayerModuleServiceController {
    constructor(private readonly ModulesService: AccessControlLayerModuleServiceService) { }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)

    @Roles(Role.Admin)
    @ApiResponse({
        status: HttpStatus.OK,
        type: [ACLModuleDTO],
        description: 'ACL Module list',
    })
    async getAll(): Promise<ACLModuleDTO[] | null> {
        return this.ModulesService.getAll();
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiResponse({
        status: HttpStatus.CREATED,
        type: ACLModuleDTO,
        description: 'Add a Module',
    })
    public async register(
        @Body() moduleData: NewACLModuleDTO,
    ): Promise<ACLModuleDTO> {
        return this.ModulesService.create(moduleData);
    }


    @Put('/update/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiBody({ type: UpdateACLModuleDTO })
    @Roles(Role.Admin)
    @ApiResponse({
        status: HttpStatus.OK,
        type: ACLModuleDTO,
        description: 'Updates a Module Permission or status by admin',
    })
    public async updateyield(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: UpdateACLModuleDTO,

    ): Promise<ACLModuleDTO> {

        return this.ModulesService.update(id, body);
    }
}
