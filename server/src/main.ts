import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { SecurityExceptionFilter } from './common/filters/security-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Validate critical security environment variables
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      logger.error('CRITICAL: JWT secrets must be set in production!');
      process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
      logger.error('CRITICAL: DATABASE_URL must be set in production!');
      process.exit(1);
    }
  }

  // Apply Helmet for HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // CSP is handled or delegated cleanly
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cookieParser());

  // Configure robust CORS handling
  const rawOrigins = process.env.CLIENT_URL || 'http://localhost:3000';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, '').toLowerCase());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
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

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
