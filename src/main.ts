import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as nodeCrypto from 'crypto';
import { createCorsOptions } from './config/cors.config';
import { configureTrustedProxy } from './config/trusted-proxy.config';

if (!(global as any).crypto) {
  (global as any).crypto = nodeCrypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureTrustedProxy(app.getHttpAdapter().getInstance());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors(createCorsOptions());
  app.use(helmet());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
