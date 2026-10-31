import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubmitCustomerRegistrationDto } from './dto/customer-registration.dto';

describe('UserService - Customer Registration (KYC Form)', () => {
  let userService: UserService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userProfile: {
        upsert: jest.fn(),
      },
      customerRegistration: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn((callback) => {
        if (typeof callback === 'function') {
          return callback(prisma);
        }
        return Promise.all(callback);
      }),
    };

    auditService = {
      logEvent: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  describe('getCustomerRegistration', () => {
    it('should return uncompleted status and default values if no record exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'customer@example.com',
        customer_registration_completed: false,
        profile: {
          country_code: 'BD',
          phone_number: '+8801700000000',
          first_name: 'John',
          last_name: 'Doe',
        },
        customer_registration: null,
      });

      const res = await userService.getCustomerRegistration('user-1');
      expect(res.isCompleted).toBe(false);
      expect(res.email).toBe('customer@example.com');
      expect(res.defaultCountry).toBe('BD');
      expect(res.defaultName).toBe('John Doe');
      expect(res.data).toBeNull();
    });

    it('should return existing record if already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'customer@example.com',
        customer_registration_completed: true,
        profile: { country_code: 'BD' },
        customer_registration: {
          id: 'reg-1',
          full_name: 'John Doe',
          nid_passport_number: 'NID-123456',
          customer_type: 'INDIVIDUAL',
        },
      });

      const res = await userService.getCustomerRegistration('user-1');
      expect(res.isCompleted).toBe(true);
      expect(res.data.nid_passport_number).toBe('NID-123456');
    });
  });

  describe('submitCustomerRegistration', () => {
    const validIndividualDto: SubmitCustomerRegistrationDto = {
      customerType: 'INDIVIDUAL' as any,
      fullName: 'John Doe',
      nidPassportNumber: '1990123456789',
      phoneNumber: '+8801712345678',
      email: 'john.doe@example.com',
      dateOfBirth: '1990-05-15',
      gender: 'MALE' as any,
      presentStreet: 'Road 12, House 45, Banani',
      presentCity: 'Dhaka',
      presentPostalCode: '1213',
      presentCountry: 'Bangladesh',
      sameAsPresentAddress: true,
      permanentStreet: 'Road 12, House 45, Banani',
      permanentCity: 'Dhaka',
      permanentPostalCode: '1213',
      permanentCountry: 'Bangladesh',
      fatherName: 'Robert Doe',
      motherName: 'Mary Doe',
      contactPhone: '+8801712345678',
      contactEmail: 'john.doe@example.com',
      declarationConfirmed: true,
    };

    it('should reject submission if declaration is not confirmed', async () => {
      const invalidDto = { ...validIndividualDto, declarationConfirmed: false };
      await expect(
        userService.submitCustomerRegistration('user-1', invalidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject company registration if company name is missing', async () => {
      const invalidCompanyDto: SubmitCustomerRegistrationDto = {
        ...validIndividualDto,
        customerType: 'COMPANY' as any,
        companyName: '',
      };
      await expect(
        userService.submitCustomerRegistration('user-1', invalidCompanyDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully save Individual customer registration and mark user as completed', async () => {
      const mockSavedRecord = {
        id: 'reg-uuid-1',
        user_id: 'user-1',
        ...validIndividualDto,
      };

      prisma.customerRegistration.upsert.mockResolvedValue(mockSavedRecord);
      prisma.user.update.mockResolvedValue({ id: 'user-1', customer_registration_completed: true });
      prisma.userProfile.upsert.mockResolvedValue({ id: 'profile-1' });

      const res = await userService.submitCustomerRegistration('user-1', validIndividualDto);

      expect(res.success).toBe(true);
      expect(res.customerRegistrationCompleted).toBe(true);
      expect(prisma.customerRegistration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 'user-1' },
          create: expect.objectContaining({
            full_name: 'John Doe',
            nid_passport_number: '1990123456789',
            declaration_confirmed: true,
          }),
        }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          customer_registration_completed: true,
          status: 'ACTIVE',
        },
      });
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          eventType: 'KYC_CUSTOMER_REGISTRATION_COMPLETED',
        }),
      );
    });

    it('should successfully save Company customer registration with company fields', async () => {
      const companyDto: SubmitCustomerRegistrationDto = {
        ...validIndividualDto,
        customerType: 'COMPANY' as any,
        companyName: 'Tech Innovations Ltd.',
        authorizedPersonName: 'John Doe',
        companyPosition: 'MANAGING_DIRECTOR' as any,
      };

      const mockSavedRecord = {
        id: 'reg-uuid-2',
        user_id: 'user-1',
        ...companyDto,
      };

      prisma.customerRegistration.upsert.mockResolvedValue(mockSavedRecord);
      prisma.user.update.mockResolvedValue({ id: 'user-1', customer_registration_completed: true });
      prisma.userProfile.upsert.mockResolvedValue({ id: 'profile-1' });

      const res = await userService.submitCustomerRegistration('user-1', companyDto);

      expect(res.success).toBe(true);
      expect(prisma.customerRegistration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            customer_type: 'COMPANY',
            company_name: 'Tech Innovations Ltd.',
            authorized_person_name: 'John Doe',
            company_position: 'MANAGING_DIRECTOR',
          }),
        }),
      );
    });
  });
});
