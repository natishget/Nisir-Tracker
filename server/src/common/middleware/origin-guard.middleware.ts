import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class OriginGuardMiddleware implements NestMiddleware {
  constructor(private readonly config: AppConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method.toUpperCase();
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    if (safeMethods.includes(method)) {
      return next();
    }

    const allowedOrigins = this.config.allowedOrigins;
    const origin = req.headers['origin'] as string | undefined;
    const referer = req.headers['referer'] as string | undefined;

    // Check origin first if present
    if (origin) {
      const normalizedOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();
      if (!allowedOrigins.includes(normalizedOrigin)) {
        throw new ForbiddenException(
          'Cross-site request blocked: untrusted origin',
        );
      }
      return next();
    }

    // Fall back to referer check
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const normalizedRefererOrigin = refererUrl.origin
          .trim()
          .replace(/\/+$/, '')
          .toLowerCase();
        if (!allowedOrigins.includes(normalizedRefererOrigin)) {
          throw new ForbiddenException(
            'Cross-site request blocked: untrusted referer',
          );
        }
      } catch {
        throw new ForbiddenException(
          'Cross-site request blocked: invalid referer header',
        );
      }
    }

    // Requests without origin/referer (e.g. server-to-server or development tools) proceed
    next();
  }
}
