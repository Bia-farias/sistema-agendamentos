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
  name: 'Meu Estabelecimento',
  slug: 'meu-estabelecimento',
  plan: 'pro',
  business_type: 'beauty_salon',
  phone: '',
  email: '',
  address: '',
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
    full_name: 'Super Administrador',
    role: 'super_admin',
    email: 'admin@agendaai.com',
    phone: '',
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
