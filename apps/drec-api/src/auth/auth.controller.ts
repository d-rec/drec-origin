import {
  Controller,
  Request,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { IUser } from '../models';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginReturnDataDTO } from './dto/login-return-data.dto';
import { LoginDataDTO } from './dto/login-data.dto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
@ApiTags('auth')
@ApiBearerAuth('access-token')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(AuthGuard(['oauth2-client-password', 'local']))
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDataDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: LoginReturnDataDTO,
    description: 'Log in',
  })
  async login(@Request() req: ExpressRequest): Promise<LoginReturnDataDTO> {
    console.log("authbcontroller", req.user);
    console.log("authbcontroller", req.body);
    //@ts-ignore
    const loginuser = req.user.email;
    console.log((req.body.username != loginuser));
    //@ts-ignore
    if (req.user.role === "ApiUser") {
      if (!req.headers || (!req.headers['client_id'] || !req.headers['client_secret'])) {
        throw new UnauthorizedException({ statusCode: 401, message: "client_id or client_secret missing from headers" });
        //@ts-ignore
        // return this.fail();

      } else if(req.body.username != loginuser) {
        console.log((req.body.username != loginuser));
        throw new UnauthorizedException();
  
      }

    }
   
    return  this.authService.login(req.user as Omit<IUser, 'password'>);
  }
}
