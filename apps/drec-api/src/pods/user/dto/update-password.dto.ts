import { UserPasswordUpdate } from '@energyweb/origin-backend-core';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import {Match} from '../decorators/match.decorator';
export class UpdatePasswordDTO implements UserPasswordUpdate {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
}

export class UpdateChangePasswordDTO {
  // @ApiProperty({ type: String })
  // @IsEmail()
  // email: string;
 


  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  newPassword: string;
 
  @ApiProperty({ type: String })
  @Match('newPassword')
  confirmPassword?: string;
}
