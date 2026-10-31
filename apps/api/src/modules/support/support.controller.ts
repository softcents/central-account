import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SupportService } from './support.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTicketDto, TicketAttachmentDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageSenderType, TicketCategory, TicketStatus } from '@prisma/client';

@Controller('support/tickets')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.supportService.createTicket(userId, dto, ipAddress, userAgent);
  }

  @Get()
  async listTickets(
    @CurrentUser('id') userId: string,
    @Query('category') category?: TicketCategory,
    @Query('status') status?: TicketStatus,
  ) {
    return this.supportService.getUserTickets(userId, category, status);
  }

  @Get(':id')
  async getTicketDetail(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.supportService.getTicketById(ticketId, userId, false);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async addMessage(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.supportService.addMessage(
      ticketId,
      userId,
      MessageSenderType.USER,
      dto,
      ipAddress,
      userAgent,
      false,
    );
  }

  @Post(':id/attachments')
  @HttpCode(HttpStatus.OK)
  async uploadAttachments(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @Body('attachments') attachments: TicketAttachmentDto[],
  ) {
    return this.supportService.uploadAttachments(ticketId, userId, attachments || [], false);
  }

  @Get(':id/attachments/:attachmentId')
  async streamAttachment(
    @Param('id') ticketId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const file = await this.supportService.getAttachmentFile(ticketId, attachmentId, userId, false);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    res.setHeader('Content-Length', file.fileSize);
    return res.sendFile(file.filePath);
  }
}
