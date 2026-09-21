import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/appError.js';
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
        _count: {
          select: { appointments: true },
        },
      },
    });

    return professionals.map((p) => ({
      ...p,
      commissionPercentage: Number(p.commissionPercentage),
      appointmentsCount: p._count.appointments,
    }));
  },

  async getById(id: string, tenantId: string) {
    const professional = await prisma.professional.findFirst({
      where: { id, tenantId },
      include: {
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
      commissionPercentage: Number(professional.commissionPercentage),
      appointmentsCount: professional._count.appointments,
    };
  },

  async create(tenantId: string, data: CreateProfessionalInput) {
    const professional = await prisma.professional.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return {
      ...professional,
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

    const updated = await prisma.professional.update({
      where: { id },
      data,
    });

    return {
      ...updated,
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
