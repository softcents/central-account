import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OidcKeysService } from './oidc-keys.service';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { WellKnownController } from './well-known.controller';
import { ConnectedApplicationsController } from './connected-applications.controller';
import { InternalOAuthController } from './internal-oauth.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, ConfigModule, AuditModule],
  controllers: [
    OAuthController,
    WellKnownController,
    ConnectedApplicationsController,
    InternalOAuthController,
  ],
  providers: [OidcKeysService, OAuthService],
  exports: [OAuthService, OidcKeysService],
})
export class OAuthModule {}
