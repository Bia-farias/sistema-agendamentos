import { describe, it, expect } from 'vitest';

/**
 * Função utilitária que simula a filtragem de horários disponíveis
 * considerando os agendamentos ocupados e a pausa de almoço do profissional.
 */
function getAvailableSlots(params: {
  workStart: string;
  workEnd: string;
  stepMinutes: number;
  durationMinutes: number;
  breakStart?: string | null;
  breakEnd?: string | null;
  busySlots: { start: string; end: string }[];
}): string[] {
  const { workStart, workEnd, stepMinutes, durationMinutes, breakStart, breakEnd, busySlots } = params;

  function toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function toTimeString(m: number): string {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  const startMin = toMinutes(workStart);
  const endMin = toMinutes(workEnd);
  const available: string[] = [];

  const allBlocked = [...busySlots];
  if (breakStart && breakEnd) {
    allBlocked.push({ start: breakStart, end: breakEnd });
  }

  for (let cur = startMin; cur + durationMinutes <= endMin; cur += stepMinutes) {
    const slotStart = cur;
    const slotEnd = cur + durationMinutes;

    const hasCollision = allBlocked.some((b) => {
      const bStart = toMinutes(b.start);
      const bEnd = toMinutes(b.end);
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!hasCollision) {
      available.push(toTimeString(slotStart));
    }
  }

  return available;
}

describe('Agendamento Online Público - Cálculo de Horários e Regras de Negócio', () => {
  it('deve gerar horários respeitando início e fim de expediente', () => {
    const slots = getAvailableSlots({
      workStart: '09:00',
      workEnd: '12:00',
      stepMinutes: 30,
      durationMinutes: 30,
      busySlots: [],
    });

    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
  });

  it('deve bloquear automaticamente os horários durante o almoço/pausa do profissional (breakStart - breakEnd)', () => {
    const slots = getAvailableSlots({
      workStart: '11:00',
      workEnd: '14:00',
      stepMinutes: 30,
      durationMinutes: 30,
      breakStart: '12:00',
      breakEnd: '13:00',
      busySlots: [],
    });

    // 12:00 e 12:30 devem estar bloqueados
    expect(slots).toContain('11:00');
    expect(slots).toContain('11:30');
    expect(slots).not.toContain('12:00');
    expect(slots).not.toContain('12:30');
    expect(slots).toContain('13:00');
    expect(slots).toContain('13:30');
  });

  it('deve bloquear horários já agendados por outros clientes no mesmo dia', () => {
    const slots = getAvailableSlots({
      workStart: '09:00',
      workEnd: '11:00',
      stepMinutes: 30,
      durationMinutes: 30,
      busySlots: [
        { start: '09:30', end: '10:00' },
      ],
    });

    expect(slots).toEqual(['09:00', '10:00', '10:30']);
    expect(slots).not.toContain('09:30');
  });

  it('não deve permitir agendamento se a duração do serviço ultrapassar o expediente', () => {
    const slots = getAvailableSlots({
      workStart: '17:00',
      workEnd: '18:00',
      stepMinutes: 30,
      durationMinutes: 60, // 1 hora de serviço
      busySlots: [],
    });

    // Às 17:00 dura até 18:00 (ok). Às 17:30 duraria até 18:30 (fora do expediente).
    expect(slots).toEqual(['17:00']);
  });

  it('deve validar slug de tenant no formato seguro de url (slugRegex)', () => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    expect(slugRegex.test('espaco-belle')).toBe(true);
    expect(slugRegex.test('barbearia-premium')).toBe(true);
    expect(slugRegex.test('clinica123')).toBe(true);

    // Inválidos
    expect(slugRegex.test('Espaco Belle')).toBe(false); // Maiúsculas e espaços
    expect(slugRegex.test('barbearia_premium')).toBe(false); // Underscore
    expect(slugRegex.test('salao@beleza')).toBe(false); // Caracteres especiais
    expect(slugRegex.test('-slug-comeco')).toBe(false); // Inicia com hífen
    expect(slugRegex.test('slug-fim-')).toBe(false); // Termina com hífen
  });
});

