import { ApiProperty, PickType ,IntersectionType} from '@nestjs/swagger';
import { UserDTO } from './user.dto';
import { OrganizationDTO } from '../../organization/dto/organization.dto';
import { IsNotEmpty, IsString, Matches,MinLength, MaxLength, IsOptional } from 'class-validator';
import { UserRegistrationData,UserORGRegistrationData } from '../../../models';
import {Match} from '../decorators/match.decorator';
// export class CreateUserDTO
//   extends PickType(UserDTO, [
//     'title',
//     'firstName',
//     'lastName',
//     'email',
//     'telephone'
   
//   ] as const)
//   implements UserRegistrationData
// {
 

//   @ApiProperty({ type: String })
//   @MaxLength(20)
//   @Matches(/((?=.*[0-9])(?=.*[A-Za-z]).{6,})/, {
//     message:
//       'Password must contain minimum 6 characters (upper and/or lower case) and at least 1 digit',
//   })
//   @IsNotEmpty()
//   @IsString()
//   password: string;

 

// }

export class CreateUserORGDTO
  extends IntersectionType(
    PickType(UserDTO, [
      'firstName',
      'lastName',
      'email',
      
    ] as const),
    PickType(OrganizationDTO,['organizationType']as const)
    )
  
  implements UserORGRegistrationData
{

  @ApiProperty({ type: String })
  @MaxLength(20)
  @Matches(/((?=.*[0-9])(?=.*[A-Za-z]).{6,})/, {
    message:
      'Password must contain minimum 6 characters (upper and/or lower case) and at least 1 digit',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

 @ApiProperty({ type: String })
  @Match('password')
  confirmPassword?: string;
  
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  orgName?: string;
  
  /*
  note not to use g flag in regex nest 
  https://github.com/typestack/class-validator/issues/484#issuecomment-595821457
   https://stackoverflow.com/a/6739245

   */

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  orgAddress?: string;

  // @ApiProperty({ type: String })
  // @IsNotEmpty()
  // @MaxLength(6)
  // //@Matches(/(\b[A-Z0-9][A-Z0-9]+|\b[A-Z]\b)/g, {
  // @Matches(/^(?=.*\d)(?=.*[A-Z])[A-Z0-9]{6}$/, {
  //   message:
  //     'Secret key should be of 6 characters length and consist of minimum one upper case and minimum one digit, and combination should include only A-Z upper case and 0-9 numbers. please enter valid secret key',
  // })
  // @IsString()
  // secretKey?: string;
 
}
