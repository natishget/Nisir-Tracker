import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorType = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, any>;
        message = resObj.message || exception.message;
        errorType = resObj.error || exception.name;
      } else {
        message = exceptionResponse || exception.message;
        errorType = exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          message = 'A resource with this unique field already exists';
          errorType = 'Conflict';
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = 'The requested resource was not found';
          errorType = 'NotFound';
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint violation on related entity';
          errorType = 'BadRequest';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = 'Database operation could not be processed';
          errorType = 'DatabaseError';
          break;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid database input data';
      errorType = 'ValidationError';
    } else {
      // Unhandled/Unknown Exception
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred. Please try again later.';
      errorType = 'InternalServerError';
    }

    // Secure logging: Mask any potential password or token in logs
    const sanitizedUrl = request.url.replace(/([?&]token=)[^&]+/gi, '$1[REDACTED]');
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${sanitizedUrl} - Status: ${status} - Error: ${
          exception instanceof Error ? exception.message : 'Unknown'
        }`,
      );
    } else {
      this.logger.warn(`[${request.method}] ${sanitizedUrl} - Status: ${status}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
      path: sanitizedUrl,
    });
  }
}
