import { prisma } from './prisma';
import { hashPassword } from '../utils/password';

export async function runSeed() {
  console.log('🌱 Iniciando Seed do Banco de Dados Agenda AI...');

  // 1. Criar ou atualizar Tenant principal
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'espaco-belle' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Espaço Belle & Studio',
        slug: 'espaco-belle',
        plan: 'PRO',
        businessType: 'BEAUTY_SALON',
        phone: '(11) 98765-4321',
        email: 'contato@espacobelle.com.br',
        address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
        description: 'O melhor espaço de beleza e estética da região. Atendimento premium e equipe de especialistas.',
        whatsapp: '11987654321',
        instagram: '@espacobelle',
        facebook: 'espacobelleoficial',
        primaryColor: '#7c3aed',
        coverUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
        galleryUrls: [
          'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        ],
        openingTime: '08:00',
        closingTime: '20:00',
        intervalMinutes: 30,
        allowOnlineBooking: true,
      },
    });
    console.log('✅ Tenant "Espaço Belle & Studio" criado!');
  }

  // 2. Criar Usuários Demo (Senha: 123456)
  const defaultPasswordHash = await hashPassword('123456');

  const demoUsers = [
    {
      email: 'admin@agendaai.com',
      fullName: 'Beatriz Farias (Proprietária)',
      role: 'OWNER' as const,
    },
    {
      email: 'admin@studio.com',
      fullName: 'Carlos Silva (Administrador)',
      role: 'ADMIN' as const,
    },
    {
      email: 'camila@studio.com',
      fullName: 'Camila Rocha (Especialista)',
      role: 'PROFESSIONAL' as const,
    },
    {
      email: 'recepcao@studio.com',
      fullName: 'Mariana Santos (Recepção)',
      role: 'RECEPTIONIST' as const,
    },
  ];

  for (const u of demoUsers) {
    const existing = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: u.email },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: u.email,
          fullName: u.fullName,
          password: defaultPasswordHash,
          role: u.role,
        },
      });
      console.log(`✅ Usuário ${u.email} (${u.role}) criado!`);
    }
  }

  // 3. Criar Profissionais com perfil e portfólio
  const existingProf = await prisma.professional.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!existingProf) {
    await prisma.professional.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: 'Camila Rocha',
          email: 'camila@studio.com',
          phone: '(11) 98888-1111',
          role: 'Hair Stylist & Colorista',
          specialties: ['Corte Feminino', 'Mechas', 'Cronograma Capilar'],
          commissionPercentage: 50,
          color: '#ec4899',
          bio: 'Especialista em loiros e cortes visagistas com mais de 8 anos de experiência em alta costura capilar.',
          breakStart: '12:00',
          breakEnd: '13:00',
          portfolioUrls: [
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
          ],
        },
        {
          tenantId: tenant.id,
          name: 'Lucas Ferreira',
          email: 'lucas@studio.com',
          phone: '(11) 97777-2222',
          role: 'Barbeiro & Visagista',
          specialties: ['Corte Fade', 'Barba Terapia', 'Selagem'],
          commissionPercentage: 45,
          color: '#3b82f6',
          bio: 'Barbeiro de precisão, especialista em navalhados modernos e tratamentos de barba com toalha quente.',
          breakStart: '13:00',
          breakEnd: '14:00',
          portfolioUrls: [
            'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
          ],
        },
      ],
    });
    console.log('✅ Profissionais criados com sucesso!');
  }

  // 4. Criar Serviços
  const existingService = await prisma.service.findFirst({
    where: { tenantId: tenant.id },
  });

  if (!existingService) {
    await prisma.service.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: 'Corte & Escova Modelada',
          category: 'Cabelo',
          price: 95.0,
          durationMinutes: 45,
          description: 'Lavagem especial com massagem capilar, corte visagista e finalização escovada.',
        },
        {
          tenantId: tenant.id,
          name: 'Mechas & Iluminação Glow',
          category: 'Cabelo',
          price: 290.0,
          durationMinutes: 120,
          description: 'Clareamento saudável com técnica personalizada e hidratação profunda reconstrutora.',
        },
        {
          tenantId: tenant.id,
          name: 'Barba Terapia Completa',
          category: 'Barbearia',
          price: 65.0,
          durationMinutes: 30,
          description: 'Esfoliação, toalha quente com óleos essenciais, navalhado e pós-barba refrescante.',
        },
        {
          tenantId: tenant.id,
          name: 'Manicure & Pedicure Spa',
          category: 'Unhas',
          price: 75.0,
          durationMinutes: 60,
          description: 'Cutilagem russa, hidratação com parafina e esmaltação de alta durabilidade.',
        },
      ],
    });
    console.log('✅ Serviços criados com sucesso!');
  }

  console.log('🎉 Seed concluído com sucesso!');
}

// Executar se for chamado diretamente via CLI
if (require.main === module) {
  runSeed()
    .catch((e) => {
      console.error('❌ Erro no seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
