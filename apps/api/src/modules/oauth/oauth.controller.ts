import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { OidcKeysService } from './oidc-keys.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { AuthorizeQueryDto } from './dto/authorize-query.dto';
import { TokenRequestDto } from './dto/token-request.dto';
import { ConsentDto } from './dto/consent.dto';

@Controller('v1/oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly oidcKeysService: OidcKeysService,
  ) {}

  @Public()
  @Get('.well-known/openid-configuration')
  getDiscovery() {
    return this.oauthService.getOpenIdConfiguration();
  }

  @Public()
  @Get('jwks')
  getJwks() {
    return this.oidcKeysService.getPublicJwks();
  }

  @Get('authorize')
  @UseGuards(JwtAuthGuard)
  async authorize(
    @CurrentUser('id') userId: string,
    @Query() query: AuthorizeQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.oauthService.validateAuthorizeRequest(query, userId);

    if (!result.requiresConsent && result.redirectUrl) {
      return res.redirect(result.redirectUrl);
    }

    // Return JSON data or redirect to consent UI
    return res.json({
      status: 'CONSENT_REQUIRED',
      ...result,
    });
  }

  @Post('consent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitConsent(
    @CurrentUser('id') userId: string,
    @Body() dto: ConsentDto,
  ) {
    return this.oauthService.handleConsent(userId, dto);
  }

  @Public()
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async token(
    @Body() dto: TokenRequestDto,
    @Headers('authorization') authHeader?: string,
  ) {
    // Support HTTP Basic Auth for client_id:client_secret if provided
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [clientId, clientSecret] = credentials.split(':');
      if (clientId && clientSecret) {
        dto.client_id = clientId;
        dto.client_secret = clientSecret;
      }
    }

    return this.oauthService.exchangeToken(dto);
  }

  @Public()
  @Get('userinfo')
  async userinfo(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }
    const token = authHeader.substring(7);
    return this.oauthService.getUserInfo(token);
  }
}
