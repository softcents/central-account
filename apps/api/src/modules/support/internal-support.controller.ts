import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { MessageSenderType, TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

@Controller('internal/support/tickets')
@UseGuards(JwtAuthGuard)
export class InternalSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  async listTickets(
    @Query('status') status?: TicketStatus,
    @Query('category') category?: TicketCategory,
    @Query('priority') priority?: TicketPriority,
  ) {
    return this.supportService.listAllTicketsInternal({ status, category, priority });
  }

  @Get(':id')
  async getTicketDetail(@Param('id') ticketId: string) {
    return this.supportService.getTicketById(ticketId, undefined, true);
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.CREATED)
  async adminReply(
    @Param('id') ticketId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateMessageDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.supportService.addMessage(
      ticketId,
      adminId,
      MessageSenderType.ADMIN,
      dto,
      ipAddress,
      userAgent,
      true,
    );
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') ticketId: string,
    @CurrentUser('id') adminId: string,
    @CurrentUser('email') adminEmail: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.supportService.updateTicketStatusInternal(
      ticketId,
      dto,
      adminId,
      adminEmail,
      ipAddress,
      userAgent,
    );
  }

  @Get(':id/attachments/:attachmentId')
  async streamAttachment(
    @Param('id') ticketId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const file = await this.supportService.getAttachmentFile(ticketId, attachmentId, undefined, true);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    res.setHeader('Content-Length', file.fileSize);
    return res.sendFile(file.filePath);
  }
}
