import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { VerifyEmailsSeeder } from './verify-emails.seeder';

async function run() {
  const app = await NestFactory.create(SeederModule);
  const verifyEmailsSeeder = app.get(VerifyEmailsSeeder);

  try {
    await verifyEmailsSeeder.run();
  } catch (e) {
    console.error('Error verifying emails:', e);
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error('Failed to run verify emails seeder:', err);
  process.exit(1);
});
