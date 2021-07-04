import { NestFactory } from '@nestjs/core';
import { DrecModule } from './drec.module';

async function bootstrap() {
  const app = await NestFactory.create(DrecModule);
  await app.listen(3000);
}
bootstrap();
