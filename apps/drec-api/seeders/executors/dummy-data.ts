import { SeederExecutor } from '../core/seeder-executor';
import { DevicesSeeder } from '../fixtures/devices.seeder';
import { OrganizationsSeeder } from '../fixtures/organizations.seeder';
import { UsersSeeder } from '../fixtures/user.seeder';
import { VerifyEmailsSeeder } from '../fixtures/verify-emails.seeder';
import { ApiUserSeeder } from '../fixtures/api-user.seeder';

SeederExecutor.run([
  OrganizationsSeeder,
  UsersSeeder,
  DevicesSeeder,
  VerifyEmailsSeeder,
  ApiUserSeeder,
]);
