import { describe, it, expect } from 'vitest';
import { DepositConfig } from '../types/financeiro';

function calculateRequiredDeposit(servicePrice: number, config: DepositConfig): number {
  if (!config.enabled || servicePrice <= 0) {
    return 0;
  }

  if (config.type === 'percentage') {
    return Math.round((servicePrice * config.value) / 100);
  }

  // Se for fixo, nunca pode ultrapassar o valor total do serviço
  return Math.min(servicePrice, config.value);
}

describe('Regras Financeiras: Política de Sinal / Adiantamento', () => {
  it('deve retornar 0 quando o sinal estiver desabilitado', () => {
    const config: DepositConfig = {
      enabled: false,
      type: 'percentage',
      value: 30,
      require_pix_receipt: true,
      instructions: 'Instruções',
    };

    expect(calculateRequiredDeposit(100, config)).toBe(0);
  });

  it('deve calcular corretamente sinal percentual (ex: 30% de R$ 100 = R$ 30)', () => {
    const config: DepositConfig = {
      enabled: true,
      type: 'percentage',
      value: 30,
      require_pix_receipt: true,
      instructions: 'Instruções',
    };

    expect(calculateRequiredDeposit(100, config)).toBe(30);
    expect(calculateRequiredDeposit(80, config)).toBe(24);
    expect(calculateRequiredDeposit(150, config)).toBe(45);
  });

  it('deve calcular corretamente sinal com valor fixo (ex: R$ 50)', () => {
    const config: DepositConfig = {
      enabled: true,
      type: 'fixed',
      value: 50,
      require_pix_receipt: true,
      instructions: 'Instruções',
    };

    expect(calculateRequiredDeposit(120, config)).toBe(50);
  });

  it('deve limitar o valor fixo ao preço total do serviço se o serviço for mais barato que o sinal', () => {
    const config: DepositConfig = {
      enabled: true,
      type: 'fixed',
      value: 50,
      require_pix_receipt: true,
      instructions: 'Instruções',
    };

    // Serviço custa R$ 35, o sinal de R$ 50 não pode ultrapassar R$ 35
    expect(calculateRequiredDeposit(35, config)).toBe(35);
  });
});
