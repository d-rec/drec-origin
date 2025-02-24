import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsSeeder } from './permissions.seeder';
import { ACLModulePermission } from '../src/pods/permission/permission.entity';
import { originAppTypeOrmModule } from '../src/drec.module';

@Module({
  imports: [originAppTypeOrmModule(), TypeOrmModule.forFeature([ACLModulePermission])],
  providers: [PermissionsSeeder],
})
export class SeederModule {}
