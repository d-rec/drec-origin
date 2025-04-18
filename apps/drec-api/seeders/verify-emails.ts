import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { VerifyUsersSeeder } from './verify-users.seeder';

async function run() {
  const app = await NestFactory.create(SeederModule);
  const verifyUsersSeeder = app.get(VerifyUsersSeeder);

  try {
    await verifyUsersSeeder.run();
  } catch (e) {
    console.error('Error verifying users:', e);
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error('Failed to run verify users seeder:', err);
  process.exit(1);
});
