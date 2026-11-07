import { prisma } from '../database/prisma.js';
import { RegisterInput, LoginInput } from '../schemas/authSchema.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Este e-mail já está cadastrado em nossa plataforma', 409);
    }

    // Gerar slug limpo e único para o tenant
    const baseSlug = input.businessName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const hashedPassword = await hashPassword(input.password);

    // Criação atômica do Tenant + Proprietário (OWNER)
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.businessName,
          slug,
          plan: 'PRO',
          businessType: input.businessType as any,
          phone: input.businessPhone,
          email: input.email.toLowerCase(),
          openingTime: '08:00',
          closingTime: '20:00',
          intervalMinutes: 30,
          allowOnlineBooking: true,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          fullName: input.fullName,
          email: input.email.toLowerCase(),
          password: hashedPassword,
          role: 'OWNER',
          phone: input.businessPhone,
          isActive: true,
        },
      });

      return { tenant, user };
    });

    const token = generateToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: result.user.role,
      email: result.user.email,
    });

    return {
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
        phone: result.user.phone,
        avatarUrl: result.user.avatarUrl,
        tenantId: result.user.tenantId,
        createdAt: result.user.createdAt,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
        businessType: result.tenant.businessType,
        phone: result.tenant.phone,
        email: result.tenant.email,
        address: result.tenant.address,
        logoUrl: result.tenant.logoUrl,
        settings: {
          opening_time: result.tenant.openingTime,
          closing_time: result.tenant.closingTime,
          interval_minutes: result.tenant.intervalMinutes,
          allow_online_booking: result.tenant.allowOnlineBooking,
        },
      },
      token,
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase() },
      include: { tenant: true },
    });

    if (!user) {
      throw new AppError('E-mail ou senha incorretos', 401);
    }

    if (!user.isActive) {
      throw new AppError('Esta conta de usuário está inativa. Contate o administrador.', 403);
    }

    const isPasswordValid = await comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('E-mail ou senha incorretos', 401);
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
        businessType: user.tenant.businessType,
        phone: user.tenant.phone,
        email: user.tenant.email,
        address: user.tenant.address,
        logoUrl: user.tenant.logoUrl,
        settings: {
          opening_time: user.tenant.openingTime,
          closing_time: user.tenant.closingTime,
          interval_minutes: user.tenant.intervalMinutes,
          allow_online_booking: user.tenant.allowOnlineBooking,
        },
      },
      token,
    };
  },

  async getMe(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { tenant: true },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
        businessType: user.tenant.businessType,
        phone: user.tenant.phone,
        email: user.tenant.email,
        address: user.tenant.address,
        logoUrl: user.tenant.logoUrl,
        settings: {
          opening_time: user.tenant.openingTime,
          closing_time: user.tenant.closingTime,
          interval_minutes: user.tenant.intervalMinutes,
          allow_online_booking: user.tenant.allowOnlineBooking,
        },
      },
    };
  },
};
