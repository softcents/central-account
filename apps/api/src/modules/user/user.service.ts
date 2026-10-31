import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService, AuditEventType } from '../audit/audit.service';
import * as argon2 from 'argon2';
import { ChangePasswordDto, UpdateProfileDto } from './dto/user.dto';
import { SubmitCustomerRegistrationDto } from './dto/customer-registration.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        customer_registration: true,
        security: true,
        mfa_methods: {
          where: { is_enabled: true },
          select: { id: true, type: true, is_enabled: true, created_at: true },
        },
        identity_verifications: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            status: true,
            verification_level: true,
            created_at: true,
          },
        },
        business_memberships: {
          include: {
            business: {
              select: {
                id: true,
                legal_name: true,
                trade_name: true,
                status: true,
                verification_level: true,
              },
            },
          },
        },
        tenant_memberships: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const activeSessions = await this.prisma.userSession.count({
      where: { user_id: userId, is_revoked: false, expires_at: { gt: new Date() } },
    });

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      customerRegistrationCompleted: user.customer_registration_completed,
      customer_registration_completed: user.customer_registration_completed,
      status: user.status,
      createdAt: user.created_at,
      profile: user.profile,
      customerRegistration: user.customer_registration,
      customer_registration: user.customer_registration,
      mfaEnabled: user.mfa_methods.length > 0,
      mfaMethods: user.mfa_methods,
      verification: user.identity_verifications[0] || {
        status: 'PENDING',
        verification_level: 'LEVEL_0',
      },
      businesses: user.business_memberships,
      organizations: user.tenant_memberships,
      activeSessionsCount: activeSessions,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { user_id: userId },
    });

    if (existing) {
      return this.prisma.userProfile.update({
        where: { user_id: userId },
        data: {
          first_name: dto.firstName,
          last_name: dto.lastName,
          country_code: dto.countryCode,
          phone_number: dto.phoneNumber,
        },
      });
    } else {
      return this.prisma.userProfile.create({
        data: {
          user_id: userId,
          first_name: dto.firstName,
          last_name: dto.lastName,
          country_code: dto.countryCode,
          phone_number: dto.phoneNumber,
        },
      });
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await argon2.verify(user.password_hash, dto.currentPassword);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash },
    });

    await this.prisma.userSecurity.upsert({
      where: { user_id: userId },
      update: { last_password_change: new Date() },
      create: { user_id: userId, last_password_change: new Date() },
    });

    return { success: true, message: 'Password updated successfully' };
  }

  async getSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { user_id: userId, is_revoked: false, expires_at: { gt: new Date() } },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        user_agent: true,
        ip_address: true,
        device_name: true,
        created_at: true,
        expires_at: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.user_id !== userId) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { is_revoked: true },
    });

    return { success: true };
  }

  async getCustomerRegistration(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        customer_registration: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      isCompleted: user.customer_registration_completed,
      email: user.email,
      defaultCountry: user.profile?.country_code || 'BD',
      defaultPhone: user.profile?.phone_number || '',
      defaultName:
        user.profile?.first_name || user.profile?.last_name
          ? `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim()
          : '',
      data: user.customer_registration,
    };
  }

  async submitCustomerRegistration(
    userId: string,
    dto: SubmitCustomerRegistrationDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!dto.declarationConfirmed) {
      throw new BadRequestException(
        'You must confirm that all information provided is true, accurate, complete, and matches your valid National ID or Passport.',
      );
    }

    if (dto.customerType === 'COMPANY') {
      if (!dto.companyName?.trim()) {
        throw new BadRequestException('Company Name is required for company registrations');
      }
      if (!dto.authorizedPersonName?.trim()) {
        throw new BadRequestException('Authorized Person Name is required for company registrations');
      }
      if (!dto.companyPosition) {
        throw new BadRequestException('Company Position is required for company registrations');
      }
    }

    const birthDate = new Date(dto.dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      throw new BadRequestException('Invalid Date of Birth format');
    }

    const permanentStreet = dto.sameAsPresentAddress ? dto.presentStreet : dto.permanentStreet;
    const permanentCity = dto.sameAsPresentAddress ? dto.presentCity : dto.permanentCity;
    const permanentPostalCode = dto.sameAsPresentAddress
      ? dto.presentPostalCode
      : dto.permanentPostalCode;
    const permanentCountry = dto.sameAsPresentAddress ? dto.presentCountry : dto.permanentCountry;

    const result = await this.prisma.$transaction(async (tx) => {
      const regRecord = await tx.customerRegistration.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          customer_type: dto.customerType,
          company_name: dto.customerType === 'COMPANY' ? dto.companyName?.trim() : null,
          authorized_person_name:
            dto.customerType === 'COMPANY' ? dto.authorizedPersonName?.trim() : null,
          company_position: dto.customerType === 'COMPANY' ? dto.companyPosition : null,
          full_name: dto.fullName.trim(),
          nid_passport_number: dto.nidPassportNumber.trim(),
          phone_number: dto.phoneNumber.trim(),
          email: dto.email.trim().toLowerCase(),
          date_of_birth: birthDate,
          gender: dto.gender,
          present_street: dto.presentStreet.trim(),
          present_city: dto.presentCity.trim(),
          present_postal_code: dto.presentPostalCode.trim(),
          present_country: dto.presentCountry.trim(),
          same_as_present_address: !!dto.sameAsPresentAddress,
          permanent_street: permanentStreet.trim(),
          permanent_city: permanentCity.trim(),
          permanent_postal_code: permanentPostalCode.trim(),
          permanent_country: permanentCountry.trim(),
          father_name: dto.fatherName.trim(),
          mother_name: dto.motherName.trim(),
          contact_phone: dto.contactPhone.trim(),
          contact_email: dto.contactEmail.trim().toLowerCase(),
          declaration_confirmed: true,
          declaration_confirmed_at: new Date(),
        },
        update: {
          customer_type: dto.customerType,
          company_name: dto.customerType === 'COMPANY' ? dto.companyName?.trim() : null,
          authorized_person_name:
            dto.customerType === 'COMPANY' ? dto.authorizedPersonName?.trim() : null,
          company_position: dto.customerType === 'COMPANY' ? dto.companyPosition : null,
          full_name: dto.fullName.trim(),
          nid_passport_number: dto.nidPassportNumber.trim(),
          phone_number: dto.phoneNumber.trim(),
          email: dto.email.trim().toLowerCase(),
          date_of_birth: birthDate,
          gender: dto.gender,
          present_street: dto.presentStreet.trim(),
          present_city: dto.presentCity.trim(),
          present_postal_code: dto.presentPostalCode.trim(),
          present_country: dto.presentCountry.trim(),
          same_as_present_address: !!dto.sameAsPresentAddress,
          permanent_street: permanentStreet.trim(),
          permanent_city: permanentCity.trim(),
          permanent_postal_code: permanentPostalCode.trim(),
          permanent_country: permanentCountry.trim(),
          father_name: dto.fatherName.trim(),
          mother_name: dto.motherName.trim(),
          contact_phone: dto.contactPhone.trim(),
          contact_email: dto.contactEmail.trim().toLowerCase(),
          declaration_confirmed: true,
          declaration_confirmed_at: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          customer_registration_completed: true,
          status: 'ACTIVE',
        },
      });

      const nameParts = dto.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await tx.userProfile.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          phone_number: dto.phoneNumber.trim(),
          country_code: dto.presentCountry.trim().slice(0, 3).toUpperCase(),
        },
        update: {
          first_name: firstName,
          last_name: lastName,
          phone_number: dto.phoneNumber.trim(),
          country_code: dto.presentCountry.trim().slice(0, 3).toUpperCase(),
        },
      });

      return regRecord;
    });

    await this.auditService.logEvent({
      userId,
      eventType: AuditEventType.KYC_CUSTOMER_REGISTRATION_COMPLETED,
      ipAddress,
      userAgent,
      metadata: {
        customerType: dto.customerType,
        nidPassportNumber: dto.nidPassportNumber,
        companyName: dto.companyName,
      },
    });

    return {
      success: true,
      message: 'KYC & Customer Registration completed successfully.',
      customerRegistration: result,
      data: result,
      customerRegistrationCompleted: true,
    };
  }
}
