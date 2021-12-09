import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UserRegistrationData {
  @IsOptional()
  @IsString()
  title: string;

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
  telephone: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
