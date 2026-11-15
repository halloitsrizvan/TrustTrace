import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApplication } from './bootstrap.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { port } = configureApplication(app);
  await app.listen(port);
}

await bootstrap();
