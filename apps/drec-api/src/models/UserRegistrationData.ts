import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { IFullOrganization, IUser } from '.././models';
export class UserRegistrationData {
  @IsOptional()
  @IsString()
  title?: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsEmail()
  @Transform((value: string) => value.toLowerCase())
  email: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsNotEmpty()
  @IsString()
  password: string;
  
}


export class UserORGRegistrationData {
 

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsEmail()
  @Transform((value: string) => value.toLowerCase())
  email: string;


  @IsNotEmpty()
  @IsString()
  password: string;
  @IsNotEmpty()
  @IsString()
  confirmPassword?: string;
 
  @IsString()
  @IsOptional()
  orgName?: string;
  @IsString()
  @IsOptional()
  orgAddress?: string;

  @IsOptional()
  @IsString()
  secretKey?: string;
  
 

}
