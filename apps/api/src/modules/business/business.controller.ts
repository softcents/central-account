import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BusinessService } from './business.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BusinessRoleGuard, RequireBusinessRoles } from './guards/business-role.guard';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UploadBusinessDocumentDto } from './dto/upload-business-document.dto';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  async createBusiness(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBusinessDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.businessService.createBusiness(userId, dto, ipAddress, userAgent);
  }

  @Get()
  async listUserBusinesses(@CurrentUser('id') userId: string) {
    return this.businessService.listUserBusinesses(userId);
  }

  @Get(':id')
  async getBusiness(
    @Param('id') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.businessService.getBusiness(businessId, userId);
  }

  @Post(':id/document')
  @UseGuards(BusinessRoleGuard)
  @RequireBusinessRoles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async uploadDocument(
    @Param('id') businessId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UploadBusinessDocumentDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.businessService.uploadDocument(businessId, userId, dto, ipAddress, userAgent);
  }

  @Get(':id/status')
  async getStatus(
    @Param('id') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.businessService.getStatus(businessId, userId);
  }
}
