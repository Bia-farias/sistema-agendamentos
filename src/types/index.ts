export type UserRole = 'super_admin' | 'owner' | 'admin' | 'professional' | 'receptionist';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free_single' | 'advance' | 'enterprise' | 'free' | 'starter' | 'pro';
  phone?: string;
  email?: string;
  logo_url?: string;
  business_type: 'barbershop' | 'beauty_salon' | 'aesthetic_clinic' | 'health_clinic' | 'other';
  address?: string;
  settings?: {
    opening_time: string;
    closing_time: string;
    interval_minutes: number;
    allow_online_booking: boolean;
  };
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone: string;
  birth_date?: string;
  notes?: string;
  total_spent: number;
  appointments_count: number;
  last_visit_at?: string;
  is_vip?: boolean;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  color?: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  color?: string;
  created_at: string;
}

export interface Professional {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  specialties: string[];
  commission_percentage: number;
  color?: string;
  is_active: boolean;
  working_hours?: {
    start: string;
    end: string;
    days_of_week: number[]; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  };
}

export interface Appointment {
  id: string;
  tenant_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  service_name: string;
  service_price: number;
  professional_id: string;
  professional_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  duration_minutes: number;
  status: AppointmentStatus;
  notes?: string;
  payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'unpaid';
  total_price: number;
  created_at: string;
}

export interface DashboardKPIs {
  todayRevenue: number;
  todayAppointmentsCount: number;
  todayPendingCount: number;
  todayCompletedCount: number;
  newCustomersThisMonth: number;
  occupancyRate: number; // percentage
  weeklyRevenueChange: number; // percentage variation
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

// WhatsApp Module Types
export type WhatsAppStatus = 'connected' | 'disconnected' | 'connecting';

export type WhatsAppTriggerType = 
  | 'booking_created'
  | 'before_24h'
  | 'before_2h'
  | 'after_service'
  | 'inactive_30d';

export type WhatsAppMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'confirmation' | 'reminder' | 'feedback' | 'recovery' | 'custom';
  content: string;
  variables: string[];
}

export interface WhatsAppReminderRule {
  id: string;
  title: string;
  description: string;
  trigger: WhatsAppTriggerType;
  isActive: boolean;
  templateId: string;
  timingDescription: string;
  iconName: string;
}

export interface WhatsAppMessageLog {
  id: string;
  customerName: string;
  customerPhone: string;
  appointmentId?: string;
  templateName: string;
  message: string;
  status: WhatsAppMessageStatus;
  sentAt: string;
  failureReason?: string;
}

export interface WhatsAppConnectionInfo {
  status: WhatsAppStatus;
  phoneNumber: string;
  instanceName: string;
  batteryLevel: number;
  lastSyncAt: string;
  totalSentThisMonth: number;
  confirmationRate: number;
}

