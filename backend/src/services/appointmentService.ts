import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/appError.js';
import { whatsappService } from './whatsappService.js';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  QueryAppointmentInput,
  PublicBookingInput,
} from '../schemas/appointmentSchema.js';

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function calculateDuration(start: string, end: string): number {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

export const appointmentService = {
  /**
   * Verifica se há conflito de horário para o profissional na mesma data.
   */
  async checkCollision(params: {
    tenantId: string;
    professionalId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeAppointmentId?: string;
  }): Promise<boolean> {
    const { tenantId, professionalId, date, startTime, endTime, excludeAppointmentId } = params;

    const conflicts = await prisma.appointment.findMany({
      where: {
        tenantId,
        professionalId,
        date,
        status: { not: 'CANCELLED' },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        // Intervalos se sobrepõem quando (start < existing.end) E (end > existing.start)
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    return conflicts.length > 0;
  },

  async list(tenantId: string, query: QueryAppointmentInput) {
    const { date, professionalId, clientId, status, startDate, endDate } = query;

    const where: any = {
      tenantId,
      ...(date ? { date } : {}),
      ...(professionalId ? { professionalId } : {}),
      ...(clientId ? { clientId } : {}),
      ...(status ? { status } : {}),
    };

    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true },
        },
        service: {
          select: { id: true, name: true, price: true, durationMinutes: true, color: true },
        },
        professional: {
          select: { id: true, name: true, color: true, role: true, avatarUrl: true },
        },
      },
    });

    return appointments.map((apt) => ({
      ...apt,
      totalPrice: Number(apt.totalPrice),
      service: apt.service
        ? {
            ...apt.service,
            price: Number(apt.service.price),
          }
        : null,
    }));
  },

  async getById(id: string, tenantId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        service: true,
        professional: true,
        receivables: true,
      },
    });

    if (!appointment) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    return {
      ...appointment,
      totalPrice: Number(appointment.totalPrice),
      service: appointment.service
        ? {
            ...appointment.service,
            price: Number(appointment.service.price),
          }
        : null,
      receivables: appointment.receivables.map((r) => ({
        ...r,
        originalAmount: Number(r.originalAmount),
        finalAmount: Number(r.finalAmount),
        amountPaid: Number(r.amountPaid),
      })),
    };
  },

  async create(tenantId: string, data: CreateAppointmentInput) {
    // 1. Validar existência do cliente
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });
    if (!client) {
      throw new AppError('Cliente selecionado não foi encontrado', 404);
    }

    // 2. Validar serviço
    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, tenantId },
    });
    if (!service) {
      throw new AppError('Serviço selecionado não foi encontrado', 404);
    }

    // 3. Validar profissional
    const professional = await prisma.professional.findFirst({
      where: { id: data.professionalId, tenantId },
    });
    if (!professional) {
      throw new AppError('Profissional selecionado não foi encontrado', 404);
    }

    // Calcular horários e duração
    const duration = data.durationMinutes || service.durationMinutes || 30;
    const endTime = data.endTime || addMinutesToTime(data.startTime, duration);
    const totalPrice = data.totalPrice !== undefined ? data.totalPrice : Number(service.price);

    // 4. Verificação de Colisão de Horários
    const hasCollision = await this.checkCollision({
      tenantId,
      professionalId: data.professionalId,
      date: data.date,
      startTime: data.startTime,
      endTime,
    });

    if (hasCollision) {
      throw new AppError(
        'Horário indisponível: o profissional selecionado já possui um agendamento conflitante neste intervalo.',
        409
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        serviceId: data.serviceId,
        professionalId: data.professionalId,
        date: data.date,
        startTime: data.startTime,
        endTime,
        durationMinutes: duration,
        status: 'PENDING',
        paymentMethod: data.paymentMethod || 'UNPAID',
        totalPrice,
        notes: data.notes || null,
      },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        service: { select: { id: true, name: true, price: true, durationMinutes: true, color: true } },
        professional: { select: { id: true, name: true, color: true, role: true } },
      },
    });

    // Disparo automático de template WhatsApp (não bloqueante)
    if (client.phone) {
      whatsappService.logMessage(tenantId, {
        customerName: client.name,
        customerPhone: client.phone,
        appointmentId: appointment.id,
        templateName: 'Confirmação de Agendamento',
        message: `Olá, ${client.name}! Seu agendamento para ${service.name} em ${appointment.date} às ${appointment.startTime} com ${professional.name} foi registrado com sucesso!`,
      }).catch((err) => console.warn('[WhatsApp] Erro ao registrar log automático:', err));
    }

    return {
      ...appointment,
      totalPrice: Number(appointment.totalPrice),
      service: appointment.service
        ? {
            ...appointment.service,
            price: Number(appointment.service.price),
          }
        : null,
    };
  },

  async update(id: string, tenantId: string, data: UpdateAppointmentInput) {
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    const targetDate = data.date || existing.date;
    const targetProfessionalId = data.professionalId || existing.professionalId;
    const targetStartTime = data.startTime || existing.startTime;
    const targetEndTime =
      data.endTime ||
      (data.durationMinutes
        ? addMinutesToTime(targetStartTime, data.durationMinutes)
        : existing.endTime);

    // Se houve mudança de horário, data ou profissional, checar colisão
    if (
      data.date ||
      data.professionalId ||
      data.startTime ||
      data.endTime ||
      data.durationMinutes
    ) {
      const hasCollision = await this.checkCollision({
        tenantId,
        professionalId: targetProfessionalId,
        date: targetDate,
        startTime: targetStartTime,
        endTime: targetEndTime,
        excludeAppointmentId: id,
      });

      if (hasCollision) {
        throw new AppError(
          'Horário indisponível: o profissional selecionado já possui um agendamento conflitante neste intervalo.',
          409
        );
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.clientId ? { clientId: data.clientId } : {}),
        ...(data.serviceId ? { serviceId: data.serviceId } : {}),
        ...(data.professionalId ? { professionalId: data.professionalId } : {}),
        ...(data.date ? { date: data.date } : {}),
        ...(data.startTime ? { startTime: data.startTime } : {}),
        endTime: targetEndTime,
        ...(data.durationMinutes ? { durationMinutes: data.durationMinutes } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
        ...(data.totalPrice !== undefined ? { totalPrice: data.totalPrice } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        service: { select: { id: true, name: true, price: true, durationMinutes: true, color: true } },
        professional: { select: { id: true, name: true, color: true, role: true } },
      },
    });

    return {
      ...updated,
      totalPrice: Number(updated.totalPrice),
      service: updated.service
        ? {
            ...updated.service,
            price: Number(updated.service.price),
          }
        : null,
    };
  },

  async updateStatus(id: string, tenantId: string, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') {
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  },

  async delete(id: string, tenantId: string) {
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { receivables: true },
        },
      },
    });

    if (!existing) {
      throw new AppError('Agendamento não encontrado', 404);
    }

    // Se houver contas a receber vinculadas ou já estiver concluído, cancela em vez de excluir
    if (existing._count.receivables > 0 || existing.status === 'COMPLETED') {
      await prisma.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      return { message: 'Agendamento cancelado com sucesso (histórico financeiro preservado)', cancelled: true };
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return { message: 'Agendamento removido com sucesso', cancelled: false };
  },

  // ----------------------------------------------------------------------------
  // AUTOATENDIMENTO PÚBLICO ONLINE (/api/public/schedule/:slug)
  // ----------------------------------------------------------------------------

  async getPublicSalonBySlug(slug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        phone: true,
        email: true,
        logoUrl: true,
        address: true,
        openingTime: true,
        closingTime: true,
        intervalMinutes: true,
        allowOnlineBooking: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            price: true,
            durationMinutes: true,
            color: true,
          },
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
        },
        professionals: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            role: true,
            specialties: true,
            avatarUrl: true,
            color: true,
            workingHoursStart: true,
            workingHoursEnd: true,
            workingDays: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!tenant) {
      throw new AppError('Estabelecimento não encontrado para agendamento online', 404);
    }

    return {
      ...tenant,
      services: tenant.services.map((s) => ({
        ...s,
        price: Number(s.price),
      })),
    };
  },

  async getPublicBusySlots(slug: string, date: string, professionalId?: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, openingTime: true, closingTime: true, intervalMinutes: true },
    });

    if (!tenant) {
      throw new AppError('Estabelecimento não encontrado', 404);
    }

    const where: any = {
      tenantId: tenant.id,
      date,
      status: { not: 'CANCELLED' },
      ...(professionalId ? { professionalId } : {}),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        professionalId: true,
        startTime: true,
        endTime: true,
        durationMinutes: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return {
      date,
      openingTime: tenant.openingTime,
      closingTime: tenant.closingTime,
      intervalMinutes: tenant.intervalMinutes,
      busySlots: appointments,
    };
  },

  async bookPublicAppointment(slug: string, input: PublicBookingInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new AppError('Estabelecimento não encontrado', 404);
    }

    if (!tenant.allowOnlineBooking) {
      throw new AppError('Este estabelecimento não está aceitando agendamentos online no momento.', 403);
    }

    // 1. Validar serviço
    const service = await prisma.service.findFirst({
      where: { id: input.serviceId, tenantId: tenant.id, isActive: true },
    });
    if (!service) {
      throw new AppError('Serviço indisponível ou inexistente', 404);
    }

    // 2. Validar profissional
    const professional = await prisma.professional.findFirst({
      where: { id: input.professionalId, tenantId: tenant.id, isActive: true },
    });
    if (!professional) {
      throw new AppError('Profissional indisponível ou inexistente', 404);
    }

    // Calcular horários
    const duration = service.durationMinutes || 30;
    const endTime = addMinutesToTime(input.startTime, duration);

    // 3. Anti-colisão
    const hasCollision = await this.checkCollision({
      tenantId: tenant.id,
      professionalId: input.professionalId,
      date: input.date,
      startTime: input.startTime,
      endTime,
    });

    if (hasCollision) {
      throw new AppError('O horário selecionado acabou de ser reservado. Por favor, escolha outro horário.', 409);
    }

    // 4. Localizar ou cadastrar cliente automaticamente pelo telefone
    const cleanPhone = input.customerPhone.trim();
    let client = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        phone: cleanPhone,
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          tenantId: tenant.id,
          name: input.customerName.trim(),
          phone: cleanPhone,
          email: input.customerEmail || null,
        },
      });
    }

    // 5. Criar agendamento
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        serviceId: service.id,
        professionalId: professional.id,
        date: input.date,
        startTime: input.startTime,
        endTime,
        durationMinutes: duration,
        status: 'PENDING',
        paymentMethod: 'UNPAID',
        totalPrice: service.price,
        notes: input.notes || 'Agendamento realizado pelo cliente via link online',
      },
      include: {
        service: { select: { name: true, price: true, durationMinutes: true } },
        professional: { select: { name: true } },
      },
    });

    // Disparo automático de template WhatsApp para agendamento online público
    if (client.phone) {
      whatsappService.logMessage(tenant.id, {
        customerName: client.name,
        customerPhone: client.phone,
        appointmentId: appointment.id,
        templateName: 'Confirmação Imediata (Online)',
        message: `Olá, ${client.name}! Seu agendamento online no ${tenant.name} foi solicitado para ${appointment.service.name} no dia ${appointment.date} às ${appointment.startTime}.`,
      }).catch((err) => console.warn('[WhatsApp] Erro ao registrar log automático:', err));
    }

    return {
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      customerName: client.name,
      customerPhone: client.phone,
      serviceName: appointment.service.name,
      servicePrice: Number(appointment.service.price),
      professionalName: appointment.professional.name,
      salonName: tenant.name,
      message: 'Agendamento solicitado com sucesso!',
    };
  },
};
