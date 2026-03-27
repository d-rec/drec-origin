import { NestFactory } from '@nestjs/core';
import { SeederInterface } from './seeder-interface';
import { SeederModule } from './seeder.module';
import { Abstract, Type } from '@nestjs/common';

type Seeder = Type<SeederInterface> | Abstract<SeederInterface>;

export class SeederExecutor {
  static async run(seeders: Seeder[]): Promise<void> {
    try {
      await this.bootstrapAndExecute(seeders);
    } catch (error) {
      console.error('Seeder failed:', error);
      process.exit(1);
    }
  }

  private static async bootstrapAndExecute(seeders: Seeder[]): Promise<void> {
    console.log('Initializing seeder...');

    const app = await NestFactory.create(SeederModule);

    console.log('Seeding data...');

    for (const seeder of seeders) {
      const seederInstance = app.get<SeederInterface>(seeder);
      await seederInstance.run();
    }

    await app.close();

    console.log('Seeder completed.');
  }
}
