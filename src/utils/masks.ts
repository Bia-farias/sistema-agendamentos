/**
 * Funções utilitárias para máscaras de formulários (Telefone, Moeda, etc.)
 */

/**
 * Aplica máscara de telefone brasileiro dinamicamente enquanto o usuário digita:
 * (11) 98765-4321 ou (11) 8765-4321
 */
export function maskPhone(value: string): string {
  if (!value) return '';

  // Remove caracteres não numéricos e limita a 11 dígitos
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // 11 dígitos (celular com 9º dígito)
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Remove formatação da máscara retornando apenas números
 */
export function unmaskPhone(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Formata um valor numérico ou string digitada como moeda Real Brasileira (R$)
 */
export function maskCurrency(value: string | number): string {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  if (!value) return '';

  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  const floatValue = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(floatValue);
}

/**
 * Converte string mascarada de moeda para número float
 */
export function unmaskCurrency(value: string): number {
  if (!value) return 0;
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
}
