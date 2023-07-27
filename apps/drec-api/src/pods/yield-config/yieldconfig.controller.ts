import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  HttpStatus,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  Query,
  ParseIntPipe,
  ConflictException,
  HttpException
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';

import { YieldConfigService } from './yieldconfig.service';
import { YieldConfigDTO, NewYieldConfigDTO, UpdateYieldValueDTO } from './dto';
import { countryCodesList } from '../../models/country-code'
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { ILoggedInUser } from '../../models';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ActiveUserGuard } from '../../guards';

@ApiTags('YieldConfigration')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('yield/config')
export class YieldConfigController {
  constructor(private readonly yieldconfigService: YieldConfigService) { }



  @Get()
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOkResponse({ type: [YieldConfigDTO], description: 'Returns all Devices' })

  async getAll(): Promise<YieldConfigDTO[]> {
    return this.yieldconfigService.getAll();
  }
  @Get('/:id')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOkResponse({ type: [YieldConfigDTO], description: 'Returns all Devices' })

  async get(@Param('id') id: number): Promise<YieldConfigDTO> {
    return this.yieldconfigService.findById(id);
  }
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
    if (yieldToRegister.countryCode && typeof yieldToRegister.countryCode === "string" && yieldToRegister.countryCode.length === 3) {
      let countries = countryCodesList;
      if (countries.find(ele => ele.countryCode === yieldToRegister.countryCode) === undefined) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: ' Invalid countryCode and countryName, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
            }),
          );
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid countryCode and countryName, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
          }),
        );
      });
    }

    return await this.yieldconfigService.create(yieldToRegister, loggedUser);
  }

  @Patch('/update/:id')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
