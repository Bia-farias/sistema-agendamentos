import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/appError.js';
import { CreateClientInput, UpdateClientInput, QueryClientInput } from '../schemas/clientSchema.js';

export const clientService = {
  async list(tenantId: string, query: QueryClientInput) {
    const { search, isVip, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(isVip !== undefined ? { isVip } : {}),
    };

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { appointments: true },
          },
        },
      }),
    ]);

    return {
      clients: clients.map((c) => ({
        ...c,
        appointmentsCount: c._count.appointments,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string, tenantId: string) {
    const client = await prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        appointments: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            service: { select: { name: true, price: true } },
            professional: { select: { name: true } },
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    return {
      ...client,
      appointmentsCount: client._count.appointments,
    };
  },

  async create(tenantId: string, data: CreateClientInput) {
    const client = await prisma.client.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return client;
  },

  async update(id: string, tenantId: string, data: UpdateClientInput) {
    const existing = await prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const updated = await prisma.client.update({
      where: { id },
      data,
    });

    return updated;
  },

  async delete(id: string, tenantId: string) {
    const existing = await prisma.client.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!existing) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (existing._count.appointments > 0) {
      throw new AppError(
        'Não é possível excluir um cliente que possui agendamentos no histórico.',
        400
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    return { message: 'Cliente removido com sucesso' };
  },
};
