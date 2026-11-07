import {
  Tenant,
  Profile,
  Customer,
  Service,
  Professional,
  Appointment,
} from '../types';

export const initialTenant: Tenant = {
  id: 'tenant-1001',
  name: 'Espaço Belle & Studio',
  slug: 'espaco-belle',
  plan: 'pro',
  business_type: 'beauty_salon',
  phone: '(11) 98765-4321',
  email: 'contato@espacobelle.com.br',
  address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  description: 'O melhor espaço de beleza e estética da região. Atendimento premium e equipe de especialistas.',
  whatsapp: '11987654321',
  instagram: '@espacobelle',
  facebook: 'espacobelleoficial',
  primary_color: '#7c3aed',
  cover_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
  gallery_urls: [
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  ],
  settings: {
    opening_time: '08:00',
    closing_time: '20:00',
    interval_minutes: 30,
    allow_online_booking: true,
  },
  created_at: new Date().toISOString(),
};

export const initialProfiles: Profile[] = [
  {
    id: 'prof-user-1',
    user_id: 'user-owner-1',
    tenant_id: 'tenant-1001',
    full_name: 'Beatriz Farias (Proprietária)',
    role: 'owner',
    email: 'admin@agendaai.com',
    phone: '(11) 98765-4321',
    avatar_url: '',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prof-user-2',
    user_id: 'user-admin-1',
    tenant_id: 'tenant-1001',
    full_name: 'Carlos Silva (Administrador)',
    role: 'admin',
    email: 'admin@studio.com',
    phone: '(11) 98888-2222',
    avatar_url: '',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prof-user-3',
    user_id: 'user-prof-1',
    tenant_id: 'tenant-1001',
    full_name: 'Camila Rocha (Especialista)',
    role: 'professional',
    email: 'camila@studio.com',
    phone: '(11) 98888-1111',
    avatar_url: '',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prof-user-4',
    user_id: 'user-rec-1',
    tenant_id: 'tenant-1001',
    full_name: 'Mariana Santos (Recepção)',
    role: 'receptionist',
    email: 'recepcao@studio.com',
    phone: '(11) 97777-3333',
    avatar_url: '',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const initialProfessionals: Professional[] = [];

export const initialServices: Service[] = [];

export const initialCustomers: Customer[] = [];

// Helper to get today's date formatted as YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const initialAppointments: Appointment[] = [];
