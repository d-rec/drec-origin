import { NestFactory } from '@nestjs/core';
import { PermissionsSeeder } from './permissions.seeder';
import { DRECModule } from '../../../src/drec.module';

async function run() {
  const app = await NestFactory.createApplicationContext(DRECModule);
  const seeder = app.get(PermissionsSeeder);

  await seeder.seed();
  await app.close();
}

run().catch((error) => {
  console.error('Seeder failed:', error);
  process.exit(1);
});
