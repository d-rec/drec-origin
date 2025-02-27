import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { PermissionsSeeder } from './permissions.seeder';
import { SeederInterface } from './seeder-interface';

async function run() {
  console.log('Initializing seeder...');

  const app = await NestFactory.create(SeederModule);

  const seeders: SeederInterface[] = [
    app.get(PermissionsSeeder),
    // Add more seeders here
    // For dummy data seeders add them in ./dummy-data/index.ts 
  ];

  console.log('Seeding data...');

  for (const seeder of seeders) {
    await seeder.run();
  }

  await app.close();

  console.log('Seeder completed.');
}

run().catch((error) => {
  console.error('Seeder failed:', error);
  process.exit(1);
});
