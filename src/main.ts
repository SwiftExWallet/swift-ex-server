import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as nodeCrypto from 'crypto';

if (!(global as any).crypto) {
  (global as any).crypto = nodeCrypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: '*',
  });
  app.use(helmet());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
