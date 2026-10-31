import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessRoleGuard } from './business-role.guard';
import { PrismaService } from '../../../prisma/prisma.service';

describe('BusinessRoleGuard', () => {
  let guard: BusinessRoleGuard;
  let reflector: jest.Mocked<Reflector>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    prisma = {
      businessUser: {
        findUnique: jest.fn(),
      },
    } as any;

    guard = new BusinessRoleGuard(reflector, prisma);
  });

  const createMockContext = (userId?: string, businessId?: string): ExecutionContext => {
    const req: any = {
      user: userId ? { id: userId } : undefined,
      params: businessId ? { id: businessId } : {},
    };

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;
  };

  it('should allow access if no roles are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext('user-1', 'biz-1');

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if user id or business id is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER']);
    const context = createMockContext(undefined, 'biz-1');

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not a member of the business', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN']);
    (prisma.businessUser.findUnique as jest.Mock).mockResolvedValue(null);

    const context = createMockContext('user-1', 'biz-1');

    await expect(guard.canActivate(context)).rejects.toThrow(
      'You are not a member of this business entity',
    );
  });

  it('should throw ForbiddenException if user role does not match required roles', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN']);
    (prisma.businessUser.findUnique as jest.Mock).mockResolvedValue({
      business_id: 'biz-1',
      user_id: 'user-1',
      role: 'VIEWER',
    });

    const context = createMockContext('user-1', 'biz-1');

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Insufficient permissions. Required: OWNER, ADMIN. Current: VIEWER',
    );
  });

  it('should allow access and attach membership when user has required role', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'ADMIN']);
    const mockMembership = {
      business_id: 'biz-1',
      user_id: 'user-1',
      role: 'OWNER',
    };
    (prisma.businessUser.findUnique as jest.Mock).mockResolvedValue(mockMembership);

    const context = createMockContext('user-1', 'biz-1');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.businessMembership).toEqual(mockMembership);
  });
});
