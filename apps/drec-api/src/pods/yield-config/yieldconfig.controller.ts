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
  import { YieldConfigDTO,NewYieldConfigDTO,UpdateYieldValueDTO} from './dto';
 
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
    constructor(private readonly yieldconfigService: YieldConfigService) {}
  
   
  
    @Get()
    @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiOkResponse({ type: [YieldConfigDTO], description: 'Returns all Devices' })
    
    async getAll(): Promise<YieldConfigDTO[]> {
      return this.yieldconfigService.getAll();
    }
    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @ApiResponse({
      status: HttpStatus.OK,
      type: NewYieldConfigDTO,
      description: 'Returns a new created country yield value id',
    })
    public async create(
      @UserDecorator() loggedUser: ILoggedInUser,
      @Body() yieldToRegister: NewYieldConfigDTO,
    ): Promise<YieldConfigDTO> {
      return await this.yieldconfigService.create(yieldToRegister,loggedUser);
    }
  
    @Put('/update/:id')
    @Roles(Role.Admin)
    @ApiBody({ type: UpdateYieldValueDTO })
    @ApiResponse({
      status: HttpStatus.OK,
      type: YieldConfigDTO,
      description: 'Updates a yield value or status by admin',
    })
    public async updateyield(
      @Param('id', new ParseIntPipe()) id: number,
      @Body() body: UpdateYieldValueDTO,
      // @UserDecorator() loggedUser: ILoggedInUser,
    ): Promise<YieldConfigDTO> {
      console.log("82con");
      console.log(id);
      console.log(body);
     // console.log(loggedUser);
      return this.yieldconfigService.update(1, body);
    }
   
  }
  