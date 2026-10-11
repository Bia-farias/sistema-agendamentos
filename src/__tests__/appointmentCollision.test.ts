import { describe, it, expect } from 'vitest';
import { Appointment } from '../types';

/**
 * Função de validação de colisão de horários utilizada no sistema:
 * Um novo agendamento colide se: (novoInicio < fimExistente && novoFim > inicioExistente)
 */
function hasTimeCollision(
  newSlot: { date: string; start_time: string; end_time: string; professional_id: string },
  existingAppointments: Appointment[]
): boolean {
  return existingAppointments.some((apt) => {
    if (apt.status === 'cancelled') return false;
    if (apt.date !== newSlot.date) return false;
    if (apt.professional_id !== newSlot.professional_id) return false;

    // Overlap: (novoInicio < fimExistente && novoFim > inicioExistente)
    return newSlot.start_time < apt.end_time && newSlot.end_time > apt.start_time;
  });
}

describe('Regras de Negócio: Anti-Colisão de Agendamentos (Double-Booking)', () => {
  const existingApt: Appointment = {
    id: 'apt-1',
    tenant_id: 'tenant-1001',
    customer_id: 'cust-1',
    customer_name: 'Ana Silva',
    customer_phone: '11999998888',
    service_id: 'srv-1',
    service_name: 'Corte Feminino',
    service_price: 100,
    professional_id: 'prof-camilia',
    professional_name: 'Camila Silva',
    date: '2026-10-15',
    start_time: '14:00',
    end_time: '15:00',
    duration_minutes: 60,
    status: 'confirmed',
    total_price: 100,
    payment_method: 'unpaid',
    created_at: '2026-10-01T10:00:00Z',
  };

  it('deve detectar colisão para o mesmo horário exato (14:00 às 15:00)', () => {
    const isConflicting = hasTimeCollision(
      { date: '2026-10-15', start_time: '14:00', end_time: '15:00', professional_id: 'prof-camilia' },
      [existingApt]
    );
    expect(isConflicting).toBe(true);
  });

  it('deve detectar colisão quando o novo agendamento se sobrepõe no início (13:30 às 14:30)', () => {
    const isConflicting = hasTimeCollision(
      { date: '2026-10-15', start_time: '13:30', end_time: '14:30', professional_id: 'prof-camilia' },
      [existingApt]
    );
    expect(isConflicting).toBe(true);
  });

  it('deve detectar colisão quando o novo agendamento se sobrepõe no término (14:30 às 15:30)', () => {
    const isConflicting = hasTimeCollision(
      { date: '2026-10-15', start_time: '14:30', end_time: '15:30', professional_id: 'prof-camilia' },
      [existingApt]
    );
    expect(isConflicting).toBe(true);
  });

  it('deve detectar colisão quando o novo agendamento está contido dentro do horário existente (14:15 às 14:45)', () => {
    const isConflicting = hasTimeCollision(
      { date: '2026-10-15', start_time: '14:15', end_time: '14:45', professional_id: 'prof-camilia' },
      [existingApt]
    );
    expect(isConflicting).toBe(true);
  });

  it('NÃO deve colidir quando o horário é imediatamente anterior e adjacente (13:00 às 14:00)', () => {
    const isConflicting = hasTimeCollision(
      { date: '2026-10-15', start_time: '13:00', end_time: '14:00', professional_id: 'prof-camilia' },
      [existingApt]
    );
    expect(isConflicting).toBe(false);
  });

  it('NÃO deve colidir quando o horário é imediatamente posterior e adjacente (15:00 às 16:00)', () => {
    const isConflicting = hasTimeCollision(
      { date: '2026-10-15', start_time: '15:00', end_time: '16:00', professional_id: 'prof-camilia' },
      [existingApt]
    );
    expect(isConflicting).toBe(false);
  });

  it('NÃO deve colidir se for para outro profissional no mesmo horário', () => {
    const isConflicting = hasTimeCollision(
      { date: '2026-10-15', start_time: '14:00', end_time: '15:00', professional_id: 'prof-rodrigo' },
      [existingApt]
    );
    expect(isConflicting).toBe(false);
  });

  it('NÃO deve colidir se for em outra data para o mesmo profissional', () => {
    const isConflicting = hasTimeCollision(
      { date: '2026-10-16', start_time: '14:00', end_time: '15:00', professional_id: 'prof-camilia' },
      [existingApt]
    );
    expect(isConflicting).toBe(false);
  });

  it('NÃO deve colidir se o agendamento anterior estiver cancelado', () => {
    const cancelledApt = { ...existingApt, status: 'cancelled' as const };
    const isConflicting = hasTimeCollision(
      { date: '2026-10-15', start_time: '14:00', end_time: '15:00', professional_id: 'prof-camilia' },
      [cancelledApt]
    );
    expect(isConflicting).toBe(false);
  });
});
