import { SeederExecutor } from '../core/seeder-executor';
import { TermsAndConditionsSeeder } from '../fixtures/terms-and-condition-seeder';
import { VerifyEmailsSeeder } from '../fixtures/verify-emails.seeder';
import { VerifyOrganizationsSeeder } from '../fixtures/verify-organizations.seeder';
import { VerifyPhoneNumbersSeeder } from '../fixtures/verify-phone-number.seeder';

SeederExecutor.run([
  TermsAndConditionsSeeder,
  VerifyEmailsSeeder,
  VerifyPhoneNumbersSeeder,
  VerifyOrganizationsSeeder,
]);
