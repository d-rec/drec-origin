import {
  Controller,
  Get,
  Post,
  Patch,
  HttpStatus,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  ConflictException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { YieldConfigService } from './yieldconfig.service';
import { YieldConfigDTO, NewYieldConfigDTO, UpdateYieldValueDTO } from './dto';
import { countryCodesList } from '../../models/country-code';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { ILoggedInUser } from '../../models';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ActiveUserGuard, PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

@ApiTags('YieldConfigration')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('yield/config')
export class YieldConfigController {
  constructor(private readonly yieldconfigService: YieldConfigService) {}

  /**
   * This api route use for get all yield value of country
   * @returns {YieldConfigDTO[]}
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('YIELD_CONFIG_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    type: [YieldConfigDTO],
    description: 'Returns all country yield value',
  })
  async getAll(): Promise<YieldConfigDTO[]> {
    return this.yieldconfigService.getAll();
  }

  /**
   * This api route use for get  yield value of country by insert row id
   * @param id :number
   * @returns {YieldConfigDTO}
   */
  @Get('/:id')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('YIELD_CONFIG_MANAGEMENT_CRUDL')
  @ApiOkResponse({ type: [YieldConfigDTO], description: 'Returns all Devices' })
  async get(@Param('id') id: number): Promise<YieldConfigDTO> {
    return this.yieldconfigService.findById(id);
  }
  /**
   * This api route use to add yield value for country
   * @param loggedUser :ILoggedInUser
   * @param yieldToRegister NewYieldConfigDTO
   * @returns {YieldConfigDTO}
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Write')
  @ACLModules('YIELD_CONFIG_MANAGEMENT_CRUDL')
  //@Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: NewYieldConfigDTO,
    description: 'Returns a new created country yield value id',
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
      const countries = countryCodesList;
      if (
        countries.find(
          (ele) => ele.countryCode === yieldToRegister.countryCode,
        ) === undefined
      ) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                ' Invalid countryCode and countryName, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
            }),
          );
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:
              ' Invalid countryCode and countryName, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
          }),
        );
      });
    }

    return await this.yieldconfigService.create(yieldToRegister, loggedUser);
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
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Update')
  @ACLModules('YIELD_CONFIG_MANAGEMENT_CRUDL')
  @ApiBody({ type: UpdateYieldValueDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: YieldConfigDTO,
    description: 'Updates a yield value or status by admin',
  })
  public async updateyield(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: UpdateYieldValueDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<YieldConfigDTO> {
    return this.yieldconfigService.update(id, body, loggedUser);
  }
}
