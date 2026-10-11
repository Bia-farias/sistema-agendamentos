import { describe, it, expect } from 'vitest';
import {
  generateAppointmentConfirmationMessage,
  createWhatsAppLink,
  cleanPhoneNumber,
} from '../services/whatsapp';
import { Appointment } from '../types';

describe('Integração WhatsApp: Formatação de Mensagens e Links', () => {
  const dummyApt: Appointment = {
    id: 'apt-test-123',
    tenant_id: 'tenant-1001',
    customer_id: 'cust-1',
    customer_name: 'Mariana Souza',
    customer_phone: '(11) 98765-4321',
    service_id: 'srv-1',
    service_name: 'Corte & Hidratação',
    service_price: 120,
    professional_id: 'prof-1',
    professional_name: 'Camila Silva',
    date: '2026-10-20',
    start_time: '14:00',
    end_time: '15:00',
    duration_minutes: 60,
    status: 'confirmed',
    total_price: 120,
    payment_method: 'pix',
    created_at: '2026-10-15T10:00:00Z',
  };

  it('deve sanitizar o número de telefone removendo caracteres não numéricos', () => {
    const raw = '(11) 98765-4321';
    const cleaned = cleanPhoneNumber(raw);
    expect(cleaned).toBe('5511987654321');
  });

  it('deve gerar a mensagem com os dados exatos do agendamento', () => {
    const message = generateAppointmentConfirmationMessage(dummyApt, 'Studio Bella Donna');

    expect(message).toContain('*Mariana Souza*');
    expect(message).toContain('*Studio Bella Donna*');
    expect(message).toContain('Corte & Hidratação');
    expect(message).toContain('Camila Silva');
    expect(message).toContain('14:00 às 15:00');
    expect(message).toContain('R$ 120,00');
  });

  it('deve criar link oficial do WhatsApp devidamente codificado (URI encoded)', () => {
    const link = createWhatsAppLink('(11) 98765-4321', 'Olá, agendamento confirmado!');
    expect(link).toContain('https://api.whatsapp.com/send?phone=5511987654321');
    expect(link).toContain('text=Ol%C3%A1%2C%20agendamento%20confirmado!');
  });
});
