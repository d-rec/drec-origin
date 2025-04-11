import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { VerifyOrganizationsSeeder } from './verify-organizations.seeder';

async function run() {
  console.log('Starting organization verification process...');

  const app = await NestFactory.create(SeederModule);
  const verifyOrganizationsSeeder = app.get(VerifyOrganizationsSeeder);

  try {
    await verifyOrganizationsSeeder.run();
    console.log('Organization verification completed successfully');
  } catch (error) {
    console.error('Organization verification failed:', error);
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
}); 