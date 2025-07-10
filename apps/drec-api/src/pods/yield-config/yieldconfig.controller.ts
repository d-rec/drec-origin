import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { YieldConfigService } from './yieldconfig.service';
import { NewYieldConfigDTO, UpdateYieldValueDTO, YieldConfigDTO } from './dto';
import { countryCodesList } from '../../models/country-code';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { ILoggedInUser } from '../../models';
import { UserDecorator } from '../user/decorators/user.decorator';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

@ApiTags('Yield Configuration')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('yield/config')
export class YieldConfigController {
  constructor(private readonly yieldConfigService: YieldConfigService) {}

  /**
   * This api route use for get all yield value of country
   * @returns {YieldConfigDTO[]}
   */
  @Get()
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('YIELD_CONFIG_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get all yield values',
    description:
      'Fetches all yield values associated with countries. This endpoint is restricted to admin users and requires appropriate permissions.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [YieldConfigDTO],
    description: 'Successfully retrieved all country yield values.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  async getAll(): Promise<YieldConfigDTO[]> {
    return this.yieldConfigService.getAll();
  }

  /**
   * This api route use for get  yield value of country by insert row id
   * @param id :number
   * @returns {YieldConfigDTO}
   */
  @Get('/:id')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('YIELD_CONFIG_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get yield value by ID',
    description: 'Fetches the yield value for a specific country using its ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: YieldConfigDTO,
    description:
      'Successfully retrieved the yield value for the specified country.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No yield configuration found for the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  async get(@Param('id') id: number): Promise<YieldConfigDTO> {
    return this.yieldConfigService.findById(id);
  }
  /**
   * This api route use to add yield value for country
   * @param loggedUser :ILoggedInUser
   * @param yieldToRegister NewYieldConfigDTO
   * @returns {YieldConfigDTO}
   */
  @Post()
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Write')
  @ACLModules('YIELD_CONFIG_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Create a new yield value',
    description:
      'Adds a new yield value for a specified country. The country code must be valid and in uppercase.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: NewYieldConfigDTO,
    description:
      'Successfully created a new yield value for the specified country.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Invalid country code provided or country code does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  public async create(
    @UserDecorator() loggedUser: ILoggedInUser,
    @Body() yieldToRegister: NewYieldConfigDTO,
  ): Promise<YieldConfigDTO> {
    yieldToRegister.countryCode = yieldToRegister.countryCode.toUpperCase();
    if (
      yieldToRegister.countryCode &&
      typeof yieldToRegister.countryCode === 'string' &&
      yieldToRegister.countryCode.length === 3
    ) {
      if (
        countryCodesList.find(
          (ele) => ele.countryCode === yieldToRegister.countryCode,
        ) === undefined
      ) {
        throw new ConflictException({
          success: false,
          message:
            ' Invalid countryCode and countryName, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
        });
      }
    } else {
      throw new ConflictException({
        success: false,
        message:
          ' Invalid countryCode and countryName, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
      });
    }

    return await this.yieldConfigService.create(yieldToRegister, loggedUser);
  }

  /**
   *
   * @param id :number
   * @param body
   * @param loggedUser
   * @returns {YieldConfigDTO}
   */
  @Patch('/update/:id')
  @Roles(Role.Admin)
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Update')
  @ACLModules('YIELD_CONFIG_MANAGEMENT_CRUDL')
  @ApiBody({ type: UpdateYieldValueDTO })
  @ApiOperation({
    summary: 'Update yield value',
    description:
      'Updates the yield value or status for a specified country by its ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: YieldConfigDTO,
    description:
      'Successfully updated the yield value for the specified country.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No yield configuration found for the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request body.',
  })
  public async updateYield(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: UpdateYieldValueDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<YieldConfigDTO> {
    return this.yieldConfigService.update(id, body, loggedUser);
  }
}
