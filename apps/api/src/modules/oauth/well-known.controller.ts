import { Controller, Get } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('.well-known')
export class WellKnownController {
  constructor(private readonly oauthService: OAuthService) {}

  @Public()
  @Get('openid-configuration')
  getDiscovery() {
    return this.oauthService.getOpenIdConfiguration();
  }
}
