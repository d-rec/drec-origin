import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OrganizationModule } from '../pods/organization/organization.module';
import { UserModule } from '../pods/user/user.module';
import {PermissionModule} from '../pods/permission/permission.module'
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { ClientCredentialsStrategy } from './client.strategy';
import { EmailConfirmationModule } from 'src/pods/email-confirmation/email-confirmation.module';

@Global()
@Module({
  imports: [
    UserModule,
    OrganizationModule,
    PermissionModule,
    EmailConfirmationModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) =>{
        return ({
          secret: configService.get<string>('JWT_SECRET') || 'thisisnotsecret',
          signOptions: {
            expiresIn: '180 days' || configService.get<string>('JWT_EXPIRY_TIME') || '7 days',
          },
        })
      } ,
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy,ClientCredentialsStrategy],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
