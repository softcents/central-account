import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  type?: 'access' | 'refresh';
  is_impersonated?: boolean;
  impersonated_by?: string;
  impersonator_email?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'access_secret_key_default_32chars'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        security: true,
        mfa_methods: {
          where: { is_enabled: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.status === 'SUSPENDED' && !payload.is_impersonated) {
      throw new UnauthorizedException('User account is suspended');
    }

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      email_verified: user.email_verified,
      customer_registration_completed: user.customer_registration_completed,
      customerRegistrationCompleted: user.customer_registration_completed,
      mfa_enabled: user.mfa_methods.length > 0,
      profile: user.profile,
      is_impersonated: !!payload.is_impersonated,
      impersonated_by: payload.impersonated_by,
      impersonator_email: payload.impersonator_email,
    };
  }
}
