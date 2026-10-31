import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentStorageService } from '../identity/services/document-storage.service';
import { JobQueueService } from '../identity/services/job-queue.service';
import { AuditService } from '../audit/audit.service';

describe('BusinessService', () => {
  let service: BusinessService;
  let prisma: jest.Mocked<PrismaService>;
  let storage: jest.Mocked<DocumentStorageService>;
  let jobQueue: jest.Mocked<JobQueueService>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = {
      business: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      businessUser: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      businessDocumentType: {
        findUnique: jest.fn(),
      },
      businessDocument: {
        create: jest.fn(),
      },
      identityVerification: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(prisma)),
    } as any;

    storage = {
      saveBase64Document: jest.fn(),
    } as any;

    jobQueue = {
      enqueueBusinessKyb: jest.fn(),
    } as any;

    audit = {
      logEvent: jest.fn(),
    } as any;

    service = new BusinessService(prisma, storage, jobQueue, audit);
  });

  describe('createBusiness', () => {
    const createDto = {
      legalName: 'Apex Innovations Ltd',
      businessType: 'CORPORATION',
      countryCode: 'BD',
      address: 'Plot 4, Motijheel C/A, Dhaka',
      businessEmail: 'contact@apexinnovations.com',
      tradeLicenseNumber: 'TL-DHAKA-2026-9912',
    };

    it('should create business and assign creator as OWNER', async () => {
      (prisma.business.findFirst as jest.Mock).mockResolvedValue(null);
      const mockCreatedBusiness = {
        id: 'biz-101',
        legal_name: createDto.legalName,
        business_type: createDto.businessType,
        country_code: createDto.countryCode,
        status: 'DRAFT',
        verification_level: 'BUSINESS_LEVEL_0',
      };
      (prisma.business.create as jest.Mock).mockResolvedValue(mockCreatedBusiness);
      (prisma.businessUser.create as jest.Mock).mockResolvedValue({
        id: 'bu-1',
        business_id: 'biz-101',
        user_id: 'user-1',
        role: 'OWNER',
      });

      const res = await service.createBusiness('user-1', createDto);

      expect(res).toEqual(mockCreatedBusiness);
      expect(prisma.business.create).toHaveBeenCalled();
      expect(prisma.businessUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            business_id: 'biz-101',
            user_id: 'user-1',
            role: 'OWNER',
          }),
        }),
      );
      expect(audit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'BUSINESS_CREATED',
          userId: 'user-1',
        }),
      );
    });

    it('should throw ConflictException if trade license already registered in country', async () => {
      (prisma.business.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-biz' });

      await expect(service.createBusiness('user-1', createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getBusiness & owner KYC linkage', () => {
    it('should throw ForbiddenException if user is not a member', async () => {
      (prisma.businessUser.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getBusiness('biz-101', 'unauth-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return business and verify owner KYC status', async () => {
      (prisma.businessUser.findUnique as jest.Mock).mockResolvedValue({
        business_id: 'biz-101',
        user_id: 'user-owner',
        role: 'OWNER',
      });

      (prisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: 'biz-101',
        legal_name: 'Apex Innovations Ltd',
        members: [{ role: 'OWNER', user_id: 'user-owner' }],
        documents: [],
        verifications: [],
      });

      (prisma.identityVerification.findFirst as jest.Mock).mockResolvedValue({
        id: 'iv-999',
        status: 'VERIFIED',
        verification_level: 'LEVEL_3',
      });

      const res = await service.getBusiness('biz-101', 'user-owner');

      expect(res.id).toBe('biz-101');
      expect(res.currentUserRole).toBe('OWNER');
      expect(res.ownerKycVerified).toBe(true);
      expect(res.ownerKycDetails?.level).toBe('LEVEL_3');
    });
  });

  describe('uploadDocument', () => {
    it('should throw BadRequestException if document type is invalid', async () => {
      (prisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'biz-101' });
      (prisma.businessDocumentType.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.uploadDocument('biz-101', 'user-1', {
          documentTypeCode: 'INVALID_TYPE',
          fileBase64: 'data:image/png;base64,abc',
          fileName: 'license.png',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload trade license and enqueue asynchronous KYB verification', async () => {
      (prisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: 'biz-101',
        country_code: 'BD',
      });

      (prisma.businessDocumentType.findUnique as jest.Mock).mockResolvedValue({
        id: 'bdt-1',
        code: 'TRADE_LICENSE',
      });

      (storage.saveBase64Document as jest.Mock).mockReturnValue({
        filePath: 'uploads/business/kyb_biz-10_abc.png',
        fileName: 'license.png',
        mimeType: 'image/png',
        sha256: 'hash123',
      });

      (prisma.businessDocument.create as jest.Mock).mockResolvedValue({
        id: 'bdoc-1',
        business_id: 'biz-101',
      });

      const res = await service.uploadDocument('biz-101', 'user-1', {
        documentTypeCode: 'TRADE_LICENSE',
        fileBase64: 'data:image/png;base64,valid',
        fileName: 'license.png',
      });

      expect(res.success).toBe(true);
      expect(res.documentId).toBe('bdoc-1');
      expect(prisma.business.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'biz-101' },
          data: expect.objectContaining({
            status: 'DOCUMENT_PROCESSING',
            verification_level: 'BUSINESS_LEVEL_1',
          }),
        }),
      );
      expect(jobQueue.enqueueBusinessKyb).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-101',
          documentId: 'bdoc-1',
          ownerUserId: 'user-1',
        }),
      );
    });
  });
});
