import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/appError.js';
import { CreateServiceInput, UpdateServiceInput, QueryServiceInput } from '../schemas/serviceSchema.js';

export const serviceService = {
  async list(tenantId: string, query: QueryServiceInput) {
    const { category, isActive, search } = query;

    const where: any = {
      tenantId,
      ...(category ? { category } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    return services.map((s) => ({
      ...s,
      price: Number(s.price),
      appointmentsCount: s._count.appointments,
    }));
  },

  async getById(id: string, tenantId: string) {
    const service = await prisma.service.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!service) {
      throw new AppError('Serviço não encontrado', 404);
    }

    return {
      ...service,
      price: Number(service.price),
      appointmentsCount: service._count.appointments,
    };
  },

  async create(tenantId: string, data: CreateServiceInput) {
    const service = await prisma.service.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return {
      ...service,
      price: Number(service.price),
    };
  },

  async update(id: string, tenantId: string, data: UpdateServiceInput) {
    const existing = await prisma.service.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Serviço não encontrado', 404);
    }

    const updated = await prisma.service.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      price: Number(updated.price),
    };
  },

  async delete(id: string, tenantId: string) {
    const existing = await prisma.service.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!existing) {
      throw new AppError('Serviço não encontrado', 404);
    }

    // Se tiver agendamentos associados, realizamos soft delete (desativação)
    if (existing._count.appointments > 0) {
      await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: 'Serviço desativado com sucesso (possui agendamentos associados no histórico)',
        deactivated: true,
      };
    }

    await prisma.service.delete({
      where: { id },
    });

    return {
      message: 'Serviço removido com sucesso',
      deactivated: false,
    };
  },
};
