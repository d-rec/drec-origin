import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { VerifyUsersSeeder } from './verify-users.seeder';

async function run() {
  console.log('Starting email verification process...');

  const app = await NestFactory.create(SeederModule);
  const verifyUsersSeeder = app.get(VerifyUsersSeeder);

  try {
    await verifyUsersSeeder.run();
    console.log('Email verification completed successfully');
  } catch (error) {
    console.error('Email verification failed:', error);
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
}); 