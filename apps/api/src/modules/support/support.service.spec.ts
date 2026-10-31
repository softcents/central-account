import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupportService } from './support.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { TicketCategory, TicketPriority, TicketStatus, MessageSenderType } from '@prisma/client';

describe('SupportService', () => {
  let service: SupportService;
  let prisma: any;
  let auditService: any;
  let emailService: any;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
  };

  const mockTicket = {
    id: 'ticket-uuid-1',
    user_id: 'user-uuid-1',
    category: TicketCategory.GENERAL_SUPPORT,
    subject: 'Need help with login',
    description: 'I cannot log in to my account',
    status: TicketStatus.OPEN,
    priority: TicketPriority.NORMAL,
    assigned_admin: null,
    created_at: new Date(),
    updated_at: new Date(),
    closed_at: null,
    user: mockUser,
    messages: [
      {
        id: 'msg-uuid-1',
        ticket_id: 'ticket-uuid-1',
        sender_id: 'user-uuid-1',
        sender_type: MessageSenderType.USER,
        message: 'I cannot log in to my account',
        created_at: new Date(),
        attachments: [],
      },
    ],
    attachments: [],
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      supportTicket: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      supportTicketMessage: {
        create: jest.fn(),
      },
      supportTicketAttachment: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    emailService = {
      sendSupportReplyEmail: jest.fn().mockResolvedValue(undefined),
      sendSupportStatusEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTicket', () => {
    it('should successfully create a ticket, initial message, and audit log', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.supportTicket.create.mockResolvedValue(mockTicket);
      prisma.supportTicketMessage.create.mockResolvedValue(mockTicket.messages[0]);
      prisma.supportTicket.findUnique.mockResolvedValue(mockTicket);

      const dto = {
        category: TicketCategory.GENERAL_SUPPORT,
        subject: 'Need help with login',
        description: 'I cannot log in to my account',
        priority: TicketPriority.NORMAL,
      };

      const result = await service.createTicket('user-uuid-1', dto);

      expect(prisma.supportTicket.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-uuid-1',
          category: dto.category,
          subject: dto.subject,
          description: dto.description,
          status: TicketStatus.OPEN,
          priority: dto.priority,
        },
      });

      expect(prisma.supportTicketMessage.create).toHaveBeenCalledWith({
        data: {
          ticket_id: mockTicket.id,
          sender_id: 'user-uuid-1',
          sender_type: MessageSenderType.USER,
          message: dto.description,
        },
      });

      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          eventType: 'SUPPORT_TICKET_CREATED',
        }),
      );

      expect(result.id).toBe(mockTicket.id);
    });

    it('should throw NotFoundException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createTicket('non-existent', {
          category: TicketCategory.GENERAL_SUPPORT,
          subject: 'Help',
          description: 'Help description',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTicketById', () => {
    it('should return ticket for the owner', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.getTicketById('ticket-uuid-1', 'user-uuid-1', false);
      expect(result.id).toBe(mockTicket.id);
    });

    it('should allow admin to access any ticket', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.getTicketById('ticket-uuid-1', 'admin-uuid-9', true);
      expect(result.id).toBe(mockTicket.id);
    });

    it('should throw ForbiddenException if user tries to access another user ticket', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(mockTicket);

      await expect(
        service.getTicketById('ticket-uuid-1', 'other-user', false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(
        service.getTicketById('ticket-not-found', 'user-uuid-1', false),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMessage', () => {
    it('should add message from user and transition WAITING_FOR_USER to IN_REVIEW', async () => {
      const waitingTicket = { ...mockTicket, status: TicketStatus.WAITING_FOR_USER };
      prisma.supportTicket.findUnique.mockResolvedValue(waitingTicket);
      prisma.supportTicketMessage.create.mockResolvedValue({
        id: 'msg-uuid-2',
        ticket_id: waitingTicket.id,
        sender_id: 'user-uuid-1',
        sender_type: MessageSenderType.USER,
        message: 'Here is more information',
        created_at: new Date(),
        attachments: [],
      });
      prisma.supportTicket.update.mockResolvedValue({
        ...waitingTicket,
        status: TicketStatus.IN_REVIEW,
      });

      const message = await service.addMessage(
        'ticket-uuid-1',
        'user-uuid-1',
        MessageSenderType.USER,
        { message: 'Here is more information' },
      );

      expect(prisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-uuid-1' },
        data: expect.objectContaining({ status: TicketStatus.IN_REVIEW }),
      });
      expect(message.senderType).toBe(MessageSenderType.USER);
    });

    it('should add message from admin', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      prisma.supportTicketMessage.create.mockResolvedValue({
        id: 'msg-uuid-3',
        ticket_id: mockTicket.id,
        sender_id: 'admin-uuid-1',
        sender_type: MessageSenderType.ADMIN,
        message: 'We are investigating your issue',
        created_at: new Date(),
        attachments: [],
      });
      prisma.supportTicket.update.mockResolvedValue(mockTicket);

      const message = await service.addMessage(
        'ticket-uuid-1',
        'admin-uuid-1',
        MessageSenderType.ADMIN,
        { message: 'We are investigating your issue' },
        undefined,
        undefined,
        true,
      );

      expect(message.senderType).toBe(MessageSenderType.ADMIN);
      expect(message.message).toBe('We are investigating your issue');
    });

    it('should reject message if ticket is CLOSED', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.CLOSED,
      });

      await expect(
        service.addMessage(
          'ticket-uuid-1',
          'user-uuid-1',
          MessageSenderType.USER,
          { message: 'Can I reopen?' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTicketStatusInternal', () => {
    it('should update status and priority', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(mockTicket);
      prisma.supportTicket.update.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.APPROVED,
      });

      const updated = await service.updateTicketStatusInternal(
        'ticket-uuid-1',
        { status: TicketStatus.APPROVED },
        'admin-uuid-1',
      );

      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-uuid-1' },
          data: expect.objectContaining({ status: TicketStatus.APPROVED }),
        }),
      );
      expect(updated.status).toBe(TicketStatus.APPROVED);
    });
  });
});
