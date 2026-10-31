import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BusinessRoleGuard } from './guards/business-role.guard';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [BusinessController],
  providers: [BusinessService, BusinessRoleGuard],
  exports: [BusinessService],
})
export class BusinessModule {}
