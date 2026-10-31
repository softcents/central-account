import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { CreateTicketDto, TicketAttachmentDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { MessageSenderType, TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private readonly uploadBaseDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {
    this.uploadBaseDir = path.resolve(process.cwd(), 'uploads', 'tickets');
    if (!fs.existsSync(this.uploadBaseDir)) {
      fs.mkdirSync(this.uploadBaseDir, { recursive: true });
    }
  }

  private saveAttachmentFile(ticketId: string, attachment: TicketAttachmentDto): {
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } {
    const ticketDir = path.join(this.uploadBaseDir, ticketId);
    if (!fs.existsSync(ticketDir)) {
      fs.mkdirSync(ticketDir, { recursive: true });
    }

    // Sanitize file name
    const sanitizedOriginalName = path.basename(attachment.fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePrefix = crypto.randomBytes(8).toString('hex');
    const storageFileName = `${uniquePrefix}_${sanitizedOriginalName}`;
    const destinationPath = path.join(ticketDir, storageFileName);

    // Extract buffer from base64 (handling possible data URI prefix)
    let base64Data = attachment.fileBase64;
    let detectedMime = attachment.mimeType || 'application/octet-stream';

    if (base64Data.includes(',')) {
      const parts = base64Data.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) detectedMime = match[1];
      base64Data = parts[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(destinationPath, buffer);

    return {
      filePath: destinationPath,
      fileName: attachment.fileName,
      fileSize: buffer.length,
      mimeType: detectedMime,
    };
  }

  /**
   * Creates a new support ticket.
   */
  async createTicket(
    userId: string,
    dto: CreateTicketDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Create the Ticket and initial Message in transaction
    const ticket = await this.prisma.supportTicket.create({
      data: {
        user_id: userId,
        category: dto.category,
        subject: dto.subject.trim(),
        description: dto.description.trim(),
        status: TicketStatus.OPEN,
        priority: dto.priority || TicketPriority.NORMAL,
      },
    });

    // 2. Create the first message
    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticket_id: ticket.id,
        sender_id: userId,
        sender_type: MessageSenderType.USER,
        message: dto.description.trim(),
      },
    });

    // 3. Process attachments if provided
    if (dto.attachments && dto.attachments.length > 0) {
      for (const att of dto.attachments) {
        try {
          const fileInfo = this.saveAttachmentFile(ticket.id, att);
          await this.prisma.supportTicketAttachment.create({
            data: {
              ticket_id: ticket.id,
              message_id: message.id,
              file_path: fileInfo.filePath,
              file_name: fileInfo.fileName,
              file_size: fileInfo.fileSize,
              mime_type: fileInfo.mimeType,
            },
          });
        } catch (err: any) {
          this.logger.error(`Failed to save attachment for ticket ${ticket.id}: ${err.message}`);
        }
      }
    }

    await this.auditService.logEvent({
      userId,
      eventType: 'SUPPORT_TICKET_CREATED',
      ipAddress,
      userAgent,
      metadata: {
        ticketId: ticket.id,
        category: ticket.category,
        subject: ticket.subject,
        priority: ticket.priority,
      },
    });

    return this.getTicketById(ticket.id, userId, false);
  }

  /**
   * Retrieves list of tickets belonging to the authenticated user.
   */
  async getUserTickets(userId: string, category?: TicketCategory, status?: TicketStatus) {
    const where: any = { user_id: userId };
    if (category) where.category = category;
    if (status) where.status = status;

    const tickets = await this.prisma.supportTicket.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: { id: true, message: true, sender_type: true, created_at: true },
        },
        _count: {
          select: { messages: true, attachments: true },
        },
      },
    });

    return tickets.map((t) => ({
      id: t.id,
      category: t.category,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      messageCount: t._count.messages,
      attachmentCount: t._count.attachments,
      latestMessage: t.messages[0] || null,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      closedAt: t.closed_at,
    }));
  }

  /**
   * Retrieves ticket details including full message thread and attachment metadata.
   */
  async getTicketById(ticketId: string, userId?: string, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { id: true, email: true, profile: true },
        },
        messages: {
          orderBy: { created_at: 'asc' },
          include: {
            attachments: {
              select: {
                id: true,
                file_name: true,
                file_size: true,
                mime_type: true,
                created_at: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            file_name: true,
            file_size: true,
            mime_type: true,
            created_at: true,
          },
        },
        email_change_req: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!isAdmin && userId && ticket.user_id !== userId) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    return {
      id: ticket.id,
      userId: ticket.user_id,
      userEmail: ticket.user.email,
      userProfile: ticket.user.profile,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assignedAdmin: ticket.assigned_admin,
      messages: ticket.messages,
      attachments: ticket.attachments,
      emailChangeRequest: ticket.email_change_req,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      closedAt: ticket.closed_at,
    };
  }

  /**
   * Appends a message to a ticket thread.
   */
  async addMessage(
    ticketId: string,
    senderId: string,
    senderType: MessageSenderType,
    dto: CreateMessageDto,
    ipAddress?: string,
    userAgent?: string,
    isAdmin = false,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!isAdmin && senderType === MessageSenderType.USER && ticket.user_id !== senderId) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    if (ticket.status === TicketStatus.CLOSED && senderType === MessageSenderType.USER) {
      throw new BadRequestException('This ticket is closed. Please open a new ticket for further assistance.');
    }

    // 1. Create message
    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticket_id: ticketId,
        sender_id: senderId,
        sender_type: senderType,
        message: dto.message.trim(),
      },
    });

    // 2. Save attachments
    const savedAttachments: any[] = [];
    if (dto.attachments && dto.attachments.length > 0) {
      for (const att of dto.attachments) {
        try {
          const fileInfo = this.saveAttachmentFile(ticketId, att);
          const attRecord = await this.prisma.supportTicketAttachment.create({
            data: {
              ticket_id: ticketId,
              message_id: message.id,
              file_path: fileInfo.filePath,
              file_name: fileInfo.fileName,
              file_size: fileInfo.fileSize,
              mime_type: fileInfo.mimeType,
            },
          });
          savedAttachments.push({
            id: attRecord.id,
            file_name: attRecord.file_name,
            file_size: attRecord.file_size,
            mime_type: attRecord.mime_type,
            created_at: attRecord.created_at,
          });
        } catch (err: any) {
          this.logger.error(`Failed to save message attachment: ${err.message}`);
        }
      }
    }

    // 3. Update ticket status & timestamp
    let nextStatus = ticket.status;
    if (senderType === MessageSenderType.USER && ticket.status === TicketStatus.WAITING_FOR_USER) {
      nextStatus = TicketStatus.IN_REVIEW;
    } else if (senderType === MessageSenderType.ADMIN && ticket.status === TicketStatus.OPEN) {
      nextStatus = TicketStatus.IN_REVIEW;
    }

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        updated_at: new Date(),
      },
    });

    await this.auditService.logEvent({
      userId: ticket.user_id,
      eventType: 'SUPPORT_MESSAGE_POSTED',
      ipAddress,
      userAgent,
      metadata: {
        ticketId,
        messageId: message.id,
        senderType,
        senderId,
      },
    });

    return {
      id: message.id,
      ticketId: message.ticket_id,
      senderId: message.sender_id,
      senderType: message.sender_type,
      message: message.message,
      attachments: savedAttachments,
      createdAt: message.created_at,
    };
  }

  /**
   * Attaches files to an existing ticket without a new message.
   */
  async uploadAttachments(
    ticketId: string,
    userId: string,
    attachments: TicketAttachmentDto[],
    isAdmin = false,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!isAdmin && ticket.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const saved: any[] = [];
    for (const att of attachments) {
      const fileInfo = this.saveAttachmentFile(ticketId, att);
      const record = await this.prisma.supportTicketAttachment.create({
        data: {
          ticket_id: ticketId,
          file_path: fileInfo.filePath,
          file_name: fileInfo.fileName,
          file_size: fileInfo.fileSize,
          mime_type: fileInfo.mimeType,
        },
      });
      saved.push({
        id: record.id,
        file_name: record.file_name,
        file_size: record.file_size,
        mime_type: record.mime_type,
        created_at: record.created_at,
      });
    }

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updated_at: new Date() },
    });

    return saved;
  }

  /**
   * Securely streams an attachment.
   */
  async getAttachmentFile(ticketId: string, attachmentId: string, userId?: string, isAdmin = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (!isAdmin && userId && ticket.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const attachment = await this.prisma.supportTicketAttachment.findFirst({
      where: { id: attachmentId, ticket_id: ticketId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment record not found');
    }

    if (!fs.existsSync(attachment.file_path)) {
      throw new NotFoundException('Attachment file not found on disk');
    }

    return {
      filePath: attachment.file_path,
      fileName: attachment.file_name,
      fileSize: attachment.file_size,
      mimeType: attachment.mime_type,
    };
  }

  /**
   * Internal Admin: List all tickets with filtering
   */
  async listAllTicketsInternal(filters?: {
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
    take?: number;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;

    const tickets = await this.prisma.supportTicket.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      take: filters?.take || 50,
      include: {
        user: {
          select: { id: true, email: true, profile: true },
        },
        _count: {
          select: { messages: true, attachments: true },
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: { id: true, message: true, sender_type: true, created_at: true },
        },
      },
    });

    return tickets.map((t) => ({
      id: t.id,
      userId: t.user_id,
      userEmail: t.user.email,
      userProfile: t.user.profile,
      category: t.category,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedAdmin: t.assigned_admin,
      messageCount: t._count.messages,
      attachmentCount: t._count.attachments,
      latestMessage: t.messages[0] || null,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      closedAt: t.closed_at,
    }));
  }

  /**
   * Internal Admin: Update ticket status, priority, or assignee
   */
  async updateTicketStatusInternal(
    ticketId: string,
    dto: UpdateTicketStatusDto,
    adminId: string,
    adminEmail?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updates: any = {};
    if (dto.status) {
      updates.status = dto.status;
      if (dto.status === TicketStatus.CLOSED) {
        updates.closed_at = new Date();
      } else {
        updates.closed_at = null;
      }
    }
    if (dto.priority) updates.priority = dto.priority;
    if (dto.assignedAdmin !== undefined) updates.assigned_admin = dto.assignedAdmin || null;

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updates,
    });

    // If admin supplied notes, post as an internal / system message
    if (dto.notes && dto.notes.trim()) {
      await this.prisma.supportTicketMessage.create({
        data: {
          ticket_id: ticketId,
          sender_id: adminId,
          sender_type: MessageSenderType.ADMIN,
          message: `[Status changed to ${dto.status || ticket.status}] Note: ${dto.notes.trim()}`,
        },
      });
    }

    await this.auditService.logEvent({
      userId: ticket.user_id,
      eventType: 'SUPPORT_TICKET_STATUS_UPDATED',
      ipAddress,
      userAgent,
      metadata: {
        ticketId,
        newStatus: dto.status,
        newPriority: dto.priority,
        assignedAdmin: dto.assignedAdmin,
        adminId,
        adminEmail,
        notes: dto.notes,
      },
    });

    return {
      success: true,
      ticketId: updated.id,
      status: updated.status,
      priority: updated.priority,
      assignedAdmin: updated.assigned_admin,
      closedAt: updated.closed_at,
    };
  }
}
