import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies && request.cookies['ci_admin_token']) {
      token = request.cookies['ci_admin_token'];
    } else if (request.query && request.query.token) {
      token = request.query.token as string;
    }

    if (!token) {
      throw new UnauthorizedException('Admin authentication required');
    }

    try {
      const secret = this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'access_token_secret_key_super_secure_32chars_min',
      );
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (payload.type !== 'admin' && !payload.role) {
        throw new UnauthorizedException('Invalid admin token credentials');
      }

      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
      });

      if (!admin || admin.status !== 'ACTIVE') {
        throw new UnauthorizedException('Admin account suspended or does not exist');
      }

      request.admin = {
        id: admin.id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        role: admin.role,
      };

      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired admin session token');
    }
  }
}
