import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/appError.js';
import { hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import {
  UpdateMyPageInput,
  CreateSaasCompanyInput,
  UpdateSaasCompanyInput,
} from '../schemas/tenantSchema.js';

function formatSaasCompany(tenant: any) {
  const adminUser = Array.isArray(tenant.users) && tenant.users.length > 0 ? tenant.users[0] : null;
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    businessType: tenant.businessType,
    phone: tenant.phone,
    email: tenant.email,
    address: tenant.address,
    createdAt: tenant.createdAt,
    isActive: adminUser ? Boolean(adminUser.isActive) : true,
    admin: adminUser
      ? {
          id: adminUser.id,
          fullName: adminUser.fullName,
          email: adminUser.email,
          phone: adminUser.phone,
          isActive: Boolean(adminUser.isActive),
        }
      : null,
    metrics: {
      professionalsCount: tenant._count?.professionals || 0,
      clientsCount: tenant._count?.clients || 0,
      appointmentsCount: tenant._count?.appointments || 0,
      servicesCount: tenant._count?.services || 0,
    },
  };
}

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

  /**
   * [SAAS OWNER] Lista todas as empresas e seus respectivos acessos ADMIN
   */
  async listSaasCompanies() {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            professionals: true,
            clients: true,
            appointments: true,
            services: true,
          },
        },
      },
    });

    return tenants.map(formatSaasCompany);
  },

  /**
   * [SAAS OWNER] Cria uma nova empresa (Tenant) e seu usuário ADMIN com login e senha
   */
  async createSaasCompany(data: CreateSaasCompanyInput) {
    const cleanEmail = data.adminEmail.toLowerCase().trim();
    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new AppError(
        'Este e-mail de login já está cadastrado para outro usuário na plataforma.',
        409
      );
    }

    const baseSlug = data.name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'empresa';

    let slug = baseSlug;
    const slugExists = await prisma.tenant.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const hashedPassword = await hashPassword(data.adminPassword.trim());

    const createdTenant = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name.trim(),
          slug,
          plan: (data.plan || 'PRO') as any,
          businessType: (data.businessType || 'BEAUTY_SALON') as any,
          phone: data.phone?.trim() || null,
          email: cleanEmail,
          address: data.address?.trim() || null,
          openingTime: '08:00',
          closingTime: '20:00',
          intervalMinutes: 30,
          allowOnlineBooking: true,
        },
      });

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          fullName: data.adminName.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'ADMIN',
          phone: data.phone?.trim() || null,
          isActive: true,
        },
      });

      return tx.tenant.findUnique({
        where: { id: tenant.id },
        include: {
          users: {
            where: { role: 'ADMIN' },
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              professionals: true,
              clients: true,
              appointments: true,
              services: true,
            },
          },
        },
      });
    });

    return formatSaasCompany(createdTenant);
  },

  /**
   * [SAAS OWNER] Atualiza dados da empresa, plano, status e/ou login e senha do ADMIN
   */
  async updateSaasCompany(id: string, data: UpdateSaasCompanyInput) {
    const existing = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'ADMIN' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!existing) {
      throw new AppError('Empresa não encontrada', 404);
    }

    const currentAdmin = existing.users[0] || null;
    const cleanEmail = data.adminEmail ? data.adminEmail.toLowerCase().trim() : undefined;

    if (cleanEmail) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          ...(currentAdmin ? { NOT: { id: currentAdmin.id } } : {}),
        },
      });

      if (emailConflict) {
        throw new AppError('Este e-mail já está em uso por outro usuário na plataforma.', 409);
      }
    }

    const hashedPassword =
      data.adminPassword && data.adminPassword.trim().length >= 6
        ? await hashPassword(data.adminPassword.trim())
        : undefined;

    const updatedTenant = await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.businessType !== undefined && { businessType: data.businessType as any }),
          ...(data.plan !== undefined && { plan: data.plan as any }),
          ...(data.phone !== undefined && { phone: data.phone ? data.phone.trim() : null }),
          ...(data.address !== undefined && { address: data.address ? data.address.trim() : null }),
          ...(cleanEmail !== undefined && { email: cleanEmail }),
        },
      });

      if (currentAdmin) {
        await tx.user.update({
          where: { id: currentAdmin.id },
          data: {
            ...(data.adminName !== undefined && { fullName: data.adminName.trim() }),
            ...(cleanEmail !== undefined && { email: cleanEmail }),
            ...(hashedPassword !== undefined && { password: hashedPassword }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
        });
      } else if (cleanEmail && hashedPassword) {
        await tx.user.create({
          data: {
            tenantId: id,
            fullName: data.adminName?.trim() || existing.name,
            email: cleanEmail,
            password: hashedPassword,
            role: 'ADMIN',
            phone: data.phone?.trim() || existing.phone,
            isActive: data.isActive ?? true,
          },
        });
      }

      if (data.isActive !== undefined) {
        // Suspende ou reativa todos os logins operacionais da empresa (exceto contas OWNER/SUPER_ADMIN)
        await tx.user.updateMany({
          where: {
            tenantId: id,
            role: { notIn: ['OWNER', 'SUPER_ADMIN'] },
          },
          data: { isActive: data.isActive },
        });
      }

      return tx.tenant.findUnique({
        where: { id },
        include: {
          users: {
            where: { role: 'ADMIN' },
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              professionals: true,
              clients: true,
              appointments: true,
              services: true,
            },
          },
        },
      });
    });

    return formatSaasCompany(updatedTenant);
  },

  /**
   * [SAAS OWNER] Remove uma empresa da plataforma
   */
  async deleteSaasCompany(id: string) {
    const existing = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: { in: ['OWNER', 'SUPER_ADMIN'] } },
        },
      },
    });

    if (!existing) {
      throw new AppError('Empresa não encontrada', 404);
    }

    if (existing.users.length > 0) {
      throw new AppError(
        'Não é permitido excluir o estabelecimento vinculado à conta Master (OWNER).',
        400
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({ where: { tenantId: id } });
      await tx.receivable.deleteMany({ where: { tenantId: id } });
      await tx.payable.deleteMany({ where: { tenantId: id } });
      await tx.tenant.delete({ where: { id } });
    });

    return { message: 'Empresa e seus acessos removidos com sucesso.' };
  },

  /**
   * [SAAS OWNER] Gera token de acesso direto (impersonação) para o Administrador de uma empresa
   */
  async impersonateSaasCompany(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          orderBy: [
            { isActive: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!tenant) {
      throw new AppError('Empresa não encontrada', 404);
    }

    // Busca o usuário admin ou proprietário ativo da empresa
    let targetUser =
      tenant.users.find((u) => u.isActive && (u.role === 'ADMIN' || u.role === 'OWNER')) ||
      tenant.users.find((u) => u.isActive) ||
      tenant.users[0];

    // Se a empresa ainda não tiver usuário criado, gera um perfil ADMIN automaticamente
    if (!targetUser) {
      const defaultPassword = await hashPassword('Admin@1234');
      targetUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          fullName: `Admin ${tenant.name}`,
          email: tenant.email || `admin@${tenant.slug}.com`,
          password: defaultPassword,
          role: 'ADMIN',
          isActive: true,
        },
      });
    }

    const token = generateToken({
      userId: targetUser.id,
      tenantId: tenant.id,
      role: targetUser.role,
      email: targetUser.email,
    });

    return {
      user: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
        phone: targetUser.phone,
        avatarUrl: targetUser.avatarUrl,
        tenantId: tenant.id,
        createdAt: targetUser.createdAt,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        businessType: tenant.businessType,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        logoUrl: tenant.logoUrl,
        settings: {
          opening_time: tenant.openingTime,
          closing_time: tenant.closingTime,
          interval_minutes: tenant.intervalMinutes,
          allow_online_booking: tenant.allowOnlineBooking,
        },
        createdAt: tenant.createdAt,
      },
      token,
    };
  },
};

