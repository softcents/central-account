import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [PrismaModule, ConfigModule, JwtModule.register({}), IdentityModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthGuard, AdminRolesGuard],
  exports: [AdminService, AdminAuthGuard, AdminRolesGuard],
})
export class AdminModule {}
