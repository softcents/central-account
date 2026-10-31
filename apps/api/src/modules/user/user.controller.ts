import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { ChangePasswordDto, UpdateProfileDto } from './dto/user.dto';
import { SubmitCustomerRegistrationDto } from './dto/customer-registration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Get('me/customer-registration')
  async getCustomerRegistration(@CurrentUser('id') userId: string) {
    return this.userService.getCustomerRegistration(userId);
  }

  @Post('me/customer-registration')
  async submitCustomerRegistration(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitCustomerRegistrationDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.userService.submitCustomerRegistration(userId, dto, ipAddress, userAgent);
  }

  @Patch('me/profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Post('me/password')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, dto);
  }

  @Get('me/sessions')
  async getSessions(@CurrentUser('id') userId: string) {
    return this.userService.getSessions(userId);
  }

  @Delete('me/sessions/:id')
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.userService.revokeSession(userId, sessionId);
  }
}
