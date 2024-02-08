import {
  Controller,
  Request,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { IUser } from '../models';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginReturnDataDTO } from './dto/login-return-data.dto';
import { LoginDataDTO } from './dto/login-data.dto';
@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller()
export class AuthController { 
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDataDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LoginReturnDataDTO,
    description: 'Log in',
  })
  async login(@Request() req: ExpressRequest): Promise<LoginReturnDataDTO> {
    this.logger.verbose("Within login");
    return  await this.authService.login(req.user as Omit<IUser, 'password'>);
  }


  @UseGuards(AuthGuard('jwt'))
  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: ExpressRequest
  ) {
    this.logger.verbose("Within login");
    await this.authService.logout(req.user as Omit<IUser, 'password'>);
    return { message: 'Logout successful' };
  }
}
