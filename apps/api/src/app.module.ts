import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { MfaModule } from './modules/mfa/mfa.module';
import { CountriesModule } from './modules/countries/countries.module';
import { IdentityModule } from './modules/identity/identity.module';
import { BusinessModule } from './modules/business/business.module';
import { EmailModule } from './modules/email/email.module';
import { RedisModule } from './common/redis/redis.module';
import { SupportModule } from './modules/support/support.module';
import { EmailChangeModule } from './modules/email-change/email-change.module';
import { OAuthModule } from './modules/oauth/oauth.module';
import { AdminModule } from './modules/admin/admin.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { BillingModule } from './modules/billing/billing.module';
import { UserModule } from './modules/user/user.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { CsrfGuard } from './common/guards/csrf.guard';
import { InternalModule } from './modules/internal/internal.module';
import { TenantDomainMiddleware } from './common/middleware/tenant-domain.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    MfaModule,
    CountriesModule,
    IdentityModule,
    BusinessModule,
    EmailModule,
    RedisModule,
    SupportModule,
    EmailChangeModule,
    OAuthModule,
    AdminModule,
    TenantModule,
    BillingModule,
    UserModule,
    PublicApiModule,
    WebhookModule,
    InternalModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantDomainMiddleware).forRoutes('*');
  }
}
