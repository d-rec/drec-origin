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
  ApiOperation,
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
@ApiTags('Aclmodules')
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
   * @return {Array<ACLModuleDTO> | null}.
   * It returns array of ACLModuleDTO when there is the list of all ACLModules
   * in response of query and returns null when there is no list of ACLModules or empty.
   * */
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)

  //@Roles(Role.Admin)
  @ApiOperation({
    summary: 'Get All ACL Modules',
    description: 'Retrieves a list of all ACL modules available in the system.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ACLModuleDTO],
    description: 'List of all ACL modules.',
  })
  async getAll(): Promise<ACLModuleDTO[] | null> {
    this.logger.verbose(`With in getAll`);
    return this.ModulesService.getAll();
  }

  /*
   * It is POST api to create an ACL Module.
   * @return {ACLModuleDTO} when create api is successfull.
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Create ACL Module',
    description: 'Creates a new ACL module in the system.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ACLModuleDTO,
    description: 'Successfully created a new ACL module.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided data is invalid or missing required fields.',
  })
  public async register(
    @Body() moduleData: NewACLModuleDTO,
  ): Promise<ACLModuleDTO> {
    this.logger.verbose(`With in create`);
    return this.ModulesService.create(moduleData);
  }

  /*
   * This is PUT api to update a module permissions or status
   * @return {ACLModuleDTO} when the update is successfull.
   * @param {id} is the type of number and identifier of ACl Modules.
   */
  @Put('/update/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBody({ type: UpdateACLModuleDTO })
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Update ACL Module',
    description: "Updates an existing ACL module's permissions or status.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ACLModuleDTO,
    description: 'Successfully updated the ACL module permissions or status.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not Found. The specified ACL module does not exist.',
  })
  public async updateyield(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: UpdateACLModuleDTO,
  ): Promise<ACLModuleDTO> {
    this.logger.verbose(`With in update`);
    return this.ModulesService.update(id, body);
  }
}
