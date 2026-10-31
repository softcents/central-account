import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload size limit to support high-resolution ID documents, selfies, and attachments
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Cookie parser for reading httpOnly refresh tokens
  app.use(cookieParser());

  // Global validation pipe for strict DTO checking
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter for structured error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS configuration
  const frontendUrl = process.env.FRONTEND_URL || 'https://account.softcents.com';
  app.enableCors({
    origin: [frontendUrl, 'https://account.softcents.com', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Protection',
      'X-Tenant-Id',
      'x-tenant-id',
    ],
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Central Account API running on: http://localhost:${port}/api`);
}

bootstrap();
