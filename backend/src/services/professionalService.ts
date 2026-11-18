import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/appError.js';
import { hashPassword } from '../utils/password.js';
import {
  CreateProfessionalInput,
  UpdateProfessionalInput,
  QueryProfessionalInput,
} from '../schemas/professionalSchema.js';

export const professionalService = {
  async list(tenantId: string, query: QueryProfessionalInput) {
    const { isActive, search, role } = query;

    const where: any = {
      tenantId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(role ? { role: { equals: role, mode: 'insensitive' } } : {}),
    };

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { role: { contains: term, mode: 'insensitive' } },
      ];
    }

    const professionals = await prisma.professional.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    return professionals.map((p) => ({
      ...p,
      hasSystemAccess: Boolean(p.userId && p.user),
      commissionPercentage: Number(p.commissionPercentage),
      appointmentsCount: p._count.appointments,
    }));
  },

  async getById(id: string, tenantId: string) {
    const professional = await prisma.professional.findFirst({
      where: { id, tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        appointments: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            service: { select: { name: true, price: true } },
            client: { select: { name: true, phone: true } },
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!professional) {
      throw new AppError('Profissional não encontrado', 404);
    }

    return {
      ...professional,
      hasSystemAccess: Boolean(professional.userId && professional.user),
      commissionPercentage: Number(professional.commissionPercentage),
      appointmentsCount: professional._count.appointments,
    };
  },

  async create(tenantId: string, data: CreateProfessionalInput) {
    const { accessPassword, ...profData } = data;
    const cleanEmail = profData.email ? profData.email.toLowerCase().trim() : null;

    if (accessPassword && accessPassword.trim().length >= 6 && !cleanEmail) {
      throw new AppError(
        'Informe o e-mail do profissional para criar o login e senha de acesso.',
        400
      );
    }

    const professional = await prisma.$transaction(async (tx) => {
      let linkedUserId: string | undefined = undefined;

      if (cleanEmail && accessPassword && accessPassword.trim().length >= 6) {
        const existingUser = await tx.user.findFirst({
          where: { email: cleanEmail },
        });

        if (existingUser && existingUser.tenantId !== tenantId) {
          throw new AppError(
            'Este e-mail já está em uso por outro usuário na plataforma.',
            409
          );
        }

        const hashedPassword = await hashPassword(accessPassword.trim());

        if (existingUser) {
          const updatedUser = await tx.user.update({
            where: { id: existingUser.id },
            data: {
              fullName: profData.name,
              password: hashedPassword,
              isActive: profData.isActive ?? true,
            },
          });
          linkedUserId = updatedUser.id;
        } else {
          const createdUser = await tx.user.create({
            data: {
              tenantId,
              email: cleanEmail,
              fullName: profData.name,
              password: hashedPassword,
              role: 'PROFESSIONAL',
              phone: profData.phone || null,
              avatarUrl: profData.avatarUrl || null,
              isActive: profData.isActive ?? true,
            },
          });
          linkedUserId = createdUser.id;
        }
      }

      return tx.professional.create({
        data: {
          ...profData,
          email: cleanEmail,
          tenantId,
          ...(linkedUserId ? { userId: linkedUserId } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });
    });

    return {
      ...professional,
      hasSystemAccess: Boolean(professional.userId && professional.user),
      commissionPercentage: Number(professional.commissionPercentage),
    };
  },

  async update(id: string, tenantId: string, data: UpdateProfessionalInput) {
    const existing = await prisma.professional.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Profissional não encontrado', 404);
    }

    const { accessPassword, ...profData } = data;
    const cleanEmail =
      profData.email !== undefined
        ? profData.email
          ? profData.email.toLowerCase().trim()
          : null
        : existing.email
        ? existing.email.toLowerCase().trim()
        : null;

    if (accessPassword && accessPassword.trim().length >= 6 && !cleanEmail) {
      throw new AppError(
        'Informe o e-mail do profissional para definir uma senha de acesso.',
        400
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      let linkedUserId = existing.userId || undefined;

      if (existing.userId) {
        const userUpdateData: any = {};
        if (profData.name !== undefined) userUpdateData.fullName = profData.name;
        if (cleanEmail) userUpdateData.email = cleanEmail;
        if (profData.phone !== undefined) userUpdateData.phone = profData.phone;
        if (profData.isActive !== undefined) userUpdateData.isActive = profData.isActive;
        if (accessPassword && accessPassword.trim().length >= 6) {
          userUpdateData.password = await hashPassword(accessPassword.trim());
        }

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: existing.userId },
            data: userUpdateData,
          });
        }
      } else if (cleanEmail && accessPassword && accessPassword.trim().length >= 6) {
        const existingUser = await tx.user.findFirst({
          where: { email: cleanEmail },
        });

        if (existingUser && existingUser.tenantId !== tenantId) {
          throw new AppError(
            'Este e-mail já está em uso por outro usuário na plataforma.',
            409
          );
        }

        const hashedPassword = await hashPassword(accessPassword.trim());

        if (existingUser) {
          const updatedUser = await tx.user.update({
            where: { id: existingUser.id },
            data: {
              fullName: profData.name || existing.name,
              password: hashedPassword,
              isActive: profData.isActive ?? existing.isActive,
            },
          });
          linkedUserId = updatedUser.id;
        } else {
          const createdUser = await tx.user.create({
            data: {
              tenantId,
              email: cleanEmail,
              fullName: profData.name || existing.name,
              password: hashedPassword,
              role: 'PROFESSIONAL',
              phone: profData.phone !== undefined ? profData.phone : existing.phone,
              avatarUrl: profData.avatarUrl !== undefined ? profData.avatarUrl : existing.avatarUrl,
              isActive: profData.isActive ?? existing.isActive,
            },
          });
          linkedUserId = createdUser.id;
        }
      }

      return tx.professional.update({
        where: { id },
        data: {
          ...profData,
          ...(profData.email !== undefined ? { email: cleanEmail } : {}),
          ...(linkedUserId ? { userId: linkedUserId } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });
    });

    return {
      ...updated,
      hasSystemAccess: Boolean(updated.userId && updated.user),
      commissionPercentage: Number(updated.commissionPercentage),
    };
  },

  async delete(id: string, tenantId: string) {
    const existing = await prisma.professional.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!existing) {
      throw new AppError('Profissional não encontrado', 404);
    }

    // Se tiver agendamentos associados, desativa
    if (existing._count.appointments > 0) {
      await prisma.professional.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: 'Profissional desativado com sucesso (possui histórico de agendamentos)',
        deactivated: true,
      };
    }

    await prisma.professional.delete({
      where: { id },
    });

    return {
      message: 'Profissional removido com sucesso',
      deactivated: false,
    };
  },
};
