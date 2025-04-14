import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { VerifyUsersSeeder } from './verify-users.seeder';

async function run() {

  const app = await NestFactory.create(SeederModule);
  const verifyUsersSeeder = app.get(VerifyUsersSeeder);

  try {
    await verifyUsersSeeder.run();
  } catch (error) {
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  process.exit(1);
}); 