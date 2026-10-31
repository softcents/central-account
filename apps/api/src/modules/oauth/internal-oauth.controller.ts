import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegisterClientDto } from './dto/register-client.dto';
import { OAuthClientStatus, VerificationLevel } from '@prisma/client';

@Controller('internal/oauth/clients')
@UseGuards(JwtAuthGuard)
export class InternalOAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerClient(
    @Body() dto: RegisterClientDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.oauthService.registerClient(dto, adminId);
  }

  @Get()
  async listClients() {
    return this.oauthService.listClients();
  }

  @Post(':clientId/rotate-secret')
  @HttpCode(HttpStatus.OK)
  async rotateSecret(
    @Param('clientId') clientId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.oauthService.rotateClientSecret(clientId, adminId);
  }

  @Patch(':clientId')
  @HttpCode(HttpStatus.OK)
  async updateClient(
    @Param('clientId') clientId: string,
    @Body('status') status?: OAuthClientStatus,
    @Body('name') name?: string,
    @Body('redirectUris') redirectUris?: string[],
    @Body('allowedScopes') allowedScopes?: string[],
    @Body('requiredVerificationLevel') requiredVerificationLevel?: VerificationLevel,
    @CurrentUser('id') adminId?: string,
  ) {
    return this.oauthService.updateClient(
      clientId,
      {
        status,
        name,
        redirectUris,
        allowedScopes,
        requiredVerificationLevel,
      },
      adminId,
    );
  }
}
