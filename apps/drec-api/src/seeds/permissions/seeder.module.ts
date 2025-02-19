import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsSeeder } from './permissions.seeder';
import { ACLModulePermission } from '../../../src/pods/permission/permission.entity';
ACLModulePermission;

@Module({
  imports: [TypeOrmModule.forFeature([ACLModulePermission])],
  providers: [PermissionsSeeder],
})
export class SeederModule {}
