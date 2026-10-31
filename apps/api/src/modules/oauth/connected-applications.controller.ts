import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('oauth/applications')
@UseGuards(JwtAuthGuard)
export class ConnectedApplicationsController {
  constructor(private readonly oauthService: OAuthService) {}

  @Get()
  async listUserApplications(@CurrentUser('id') userId: string) {
    return this.oauthService.getUserAuthorizations(userId);
  }

  @Delete(':clientId')
  async revokeApplication(
    @CurrentUser('id') userId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.oauthService.revokeUserAuthorization(userId, clientId);
  }
}
