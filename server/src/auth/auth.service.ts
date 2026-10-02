import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private getAccessSecret(): string {
    return process.env.JWT_ACCESS_SECRET || 'fallback_dev_access_secret_nisir_tasker_32chars';
  }

  private getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'fallback_dev_refresh_secret_nisir_tasker_32chars';
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && user.isActive) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any, response: Response) {
    const payload = { username: user.username, sub: user.id, role: user.systemRole };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getAccessSecret(),
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { passwordHash, ...safeUser } = user;
    return {
      message: 'Login successful',
      user: safeUser,
    };
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      const user = await this.usersService.findOneById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is inactive or not found');
      }

      const newPayload = { username: user.username, sub: user.id, role: user.systemRole };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.getAccessSecret(),
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
      });

      const isProd = process.env.NODE_ENV === 'production';
      response.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });

      const { passwordHash, ...safeUser } = user;
      return {
        message: 'Token refreshed',
        user: safeUser,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(response: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logout successful' };
  }
}
