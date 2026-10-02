import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { SecurityExceptionFilter } from './common/filters/security-exception.filter';
import { AppConfigService } from './common/config/app-config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Access validated environment configuration
  const config = app.get(AppConfigService);

  // Apply Helmet for HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cookieParser());

  // Configure robust CORS handling from validated origins
  const allowedOrigins = config.allowedOrigins;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      return callback(
        new Error('Blocked by CORS policy: Origin not allowed'),
        false,
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: ['Set-Cookie'],
  });

  // Global validation pipe with strict whitelisting to eliminate mass-assignment
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter to sanitize errors and protect database internals
  app.useGlobalFilters(new SecurityExceptionFilter());

  await app.listen(config.port);
  logger.log(`Application is running on port ${config.port}`);
}
bootstrap();
