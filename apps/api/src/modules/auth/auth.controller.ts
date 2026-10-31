import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyMfaDto } from '../mfa/dto/verify-mfa.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshTokenCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.verifyEmail(dto.token, ipAddress, userAgent);

    if ('refreshToken' in result && result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
      const { refreshToken, ...responseBody } = result;
      return responseBody;
    }

    return result;
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto, @Req() req: Request) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.resendVerificationEmail(dto.email, ipAddress, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, ipAddress, userAgent);

    if ('refreshToken' in result && result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
      const { refreshToken, ...responseBody } = result;
      return responseBody;
    }

    return result;
  }

  @Public()
  @Post('mfa-challenge')
  @HttpCode(HttpStatus.OK)
  async verifyMfaChallenge(
    @Body() dto: VerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.verifyMfaChallenge(
      dto.mfaToken,
      dto.code,
      ipAddress,
      userAgent,
    );

    if (result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
      const { refreshToken, ...responseBody } = result;
      return responseBody;
    }

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] || req.body?.refreshToken;
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.authService.refreshAccessToken(refreshToken, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] || req.body?.refreshToken;
    const result = await this.authService.logout(refreshToken);
    this.clearRefreshTokenCookie(res);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return { user };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const currentRefreshToken = req.cookies?.['refresh_token'];
    return this.authService.getActiveSessions(userId, currentRefreshToken);
  }

  @Post('sessions/:id/revoke')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.authService.revokeSession(userId, sessionId);
  }
}
