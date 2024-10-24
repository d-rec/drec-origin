import {
  Controller,
  Request,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { IUser } from '../models';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginReturnDataDTO } from './dto/login-return-data.dto';
import { LoginDataDTO } from './dto/login-data.dto';
import { WithoutAuthGuard } from '../guards';
@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * @returns {Promise<LoginReturnDataDTO>}
   */
  @UseGuards(AuthGuard('local'), WithoutAuthGuard)
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDataDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LoginReturnDataDTO,
    description: 'Log in',
  })
  async login(@Request() req: ExpressRequest): Promise<LoginReturnDataDTO> {
    this.logger.verbose('Within login');
    return await this.authService.login(req.user as Omit<IUser, 'password'>);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: ExpressRequest): Promise<{ message: string }> {
    this.logger.verbose('Within login');
    const token: string = req.headers.authorization?.split(' ')[1];
    await this.authService.logout(req.user as Omit<IUser, 'password'>, token);
    return { message: 'Logout successful' };
  }

  @UseGuards(AuthGuard('local'))
  @Post('auth/getAccess')
  @ApiBody({ type: LoginDataDTO })
  async generateToken(
    @Request() req: ExpressRequest,
    @Query('privateKey') privateKey: string,
  ): Promise<LoginReturnDataDTO> {
    this.logger.verbose('With in generateToken');
    return await this.authService.generateToken(
      req.user as Omit<IUser, 'password'>,
      privateKey,
    );
  }
}
