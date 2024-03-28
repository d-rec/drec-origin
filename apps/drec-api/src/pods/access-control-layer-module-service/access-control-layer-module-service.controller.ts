import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiTags,
  ApiSecurity,
} from '@nestjs/swagger';
import { Role } from '../../utils/enums';
import { AccessControlLayerModuleServiceService } from './access-control-layer-module-service.service';
import {
  ACLModuleDTO,
  NewACLModuleDTO,
  UpdateACLModuleDTO,
} from './dto/aclmodule.dto';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../../guards/RolesGuard';

/*
 * It is Controller of ACL Module with the endpoints of ACL module operations.
 */
@ApiTags('aclmoduleservices')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('access-control-layer-module-service')
export class AccessControlLayerModuleServiceController {
  private readonly logger = new Logger(
    AccessControlLayerModuleServiceController.name,
  );

  constructor(
    private readonly ModulesService: AccessControlLayerModuleServiceService,
  ) {}

  /*
   * This is Get Api to list all the Acl modules.
   * @return {Array<ACLModuleDto> | null}.
   * It returns array of ACLModuleDto when there is the list of all ACLModules
   * in response of query and returns null when there is no list of ACLModules or empty.
   * */
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)

  //@Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ACLModuleDTO],
    description: 'ACL Module list',
  })
  async getAll(): Promise<ACLModuleDTO[] | null> {
    this.logger.verbose(`With in getAll`);
    return this.ModulesService.getAll();
  }

  /*
   * It is POST api to create an ACL Module.
   * @return {ACLModuleDto} when create api is successfull.
   */
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
    this.logger.verbose(`With in create`);
    return this.ModulesService.create(moduleData);
  }

  /*
   * This is PUT api to update a module permissions or status
   * @return {ACLModuleDto} when the update is successfull.
   * @param {id} is the type of number and identifier of ACl Modules.
   */
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
    this.logger.verbose(`With in update`);
    return this.ModulesService.update(id, body);
  }
}
