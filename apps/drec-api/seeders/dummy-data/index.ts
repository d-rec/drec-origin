import { NestFactory } from '@nestjs/core';
import { SeederModule } from '../seeder.module';
import { SeederInterface } from '../seeder-interface';
import { OrganizationsSeeder } from '../organizations.seeder'
import { UsersSeeder } from '../user.seeder';
import { DevicesSeeder } from '../devices.seeder';
async function run() {
  console.log('Initializing dummy data seeding...');

  const app = await NestFactory.create(SeederModule);
  
  const seeders: SeederInterface[] = [
     app.get(OrganizationsSeeder),
     app.get(UsersSeeder),
     app.get(DevicesSeeder),
  ];

  console.log('Seeding dummy data...');

  for (const seeder of seeders) {
    await seeder.run();
  }

  await app.close();
  console.log('Dummy data seeding completed.');
}

run().catch((error) => {
  console.error('Dummy data seeding failed:', error);
  process.exit(1);
});
