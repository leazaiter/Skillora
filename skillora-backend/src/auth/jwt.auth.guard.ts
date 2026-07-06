import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      throw new UnauthorizedException('No session cookie found');
    }

    try {
      const response = await fetch('http://localhost:3000/api/verify-session', {
        headers: { cookie: cookieHeader },
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid session');
      }

      const data = await response.json();
      req.user = { userId: data.userId, email: data.email };
      return true;

    } catch (err) {
      throw new UnauthorizedException('Could not verify session');
    }
  }
}