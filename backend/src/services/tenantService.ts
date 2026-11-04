import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/appError.js';
import { UpdateMyPageInput } from '../schemas/tenantSchema.js';

export const tenantService = {
  /**
   * Retorna os dados completos de personalização da página pública do estabelecimento
   */
  async getMyPage(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            services: { where: { isActive: true } },
            professionals: { where: { isActive: true } },
            appointments: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new AppError('Estabelecimento não encontrado', 404);
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      businessType: tenant.businessType,
      logoUrl: tenant.logoUrl,
      coverUrl: tenant.coverUrl,
      galleryUrls: tenant.galleryUrls,
      description: tenant.description,
      phone: tenant.phone,
      email: tenant.email,
      address: tenant.address,
      whatsapp: tenant.whatsapp,
      instagram: tenant.instagram,
      facebook: tenant.facebook,
      primaryColor: tenant.primaryColor || '#7c3aed',
      openingTime: tenant.openingTime,
      closingTime: tenant.closingTime,
      intervalMinutes: tenant.intervalMinutes,
      allowOnlineBooking: tenant.allowOnlineBooking,
      activeServicesCount: tenant._count.services,
      activeProfessionalsCount: tenant._count.professionals,
      totalAppointmentsCount: tenant._count.appointments,
      publicUrl: `/agendar/${tenant.slug}`,
    };
  },

  /**
   * Atualiza a personalização da página pública e o link exclusivo
   */
  async updateMyPage(tenantId: string, data: UpdateMyPageInput) {
    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existing) {
      throw new AppError('Estabelecimento não encontrado', 404);
    }

    // Se o slug foi modificado, valida se outro estabelecimento já possui
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.tenant.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: tenantId },
        },
      });

      if (slugConflict) {
        throw new AppError(
          'Este link exclusivo já está sendo utilizado por outro estabelecimento. Escolha outro slug.',
          409
        );
      }
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
        ...(data.galleryUrls !== undefined && { galleryUrls: data.galleryUrls }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
        ...(data.instagram !== undefined && { instagram: data.instagram }),
        ...(data.facebook !== undefined && { facebook: data.facebook }),
        ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
        ...(data.openingTime !== undefined && { openingTime: data.openingTime }),
        ...(data.closingTime !== undefined && { closingTime: data.closingTime }),
        ...(data.intervalMinutes !== undefined && { intervalMinutes: data.intervalMinutes }),
        ...(data.allowOnlineBooking !== undefined && { allowOnlineBooking: data.allowOnlineBooking }),
      },
    });

    return this.getMyPage(updated.id);
  },
};

