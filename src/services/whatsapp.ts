import { Appointment, Customer } from '../types';
import { formatDate, formatCurrency } from '../utils/format';
import { useWhatsAppStore } from '../stores/whatsappStore';

/**
 * Formata a data com o dia da semana em português (ex: "Segunda-feira, 28/09/2026")
 */
export function formatDateWithWeekday(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return formatDate(dateString);

  const d = new Date(year, month - 1, day);
  const weekdays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  const weekday = weekdays[d.getDay()] || '';
  const dateFormatted = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  return `${weekday}, ${dateFormatted}`;
}

export function cleanPhoneNumber(phone: string): string {
  let clean = (phone || '').replace(/\D/g, '');
  clean = clean.replace(/^0+/, '');
  return clean.startsWith('55') && clean.length >= 12 ? clean : `55${clean}`;
}

/**
 * Gera o link da API oficial do WhatsApp (Web / Mobile) para redirecionamento direto
 * Endpoint: https://api.whatsapp.com/send?phone=...&text=...
 */
export function createWhatsAppLink(phone: string, message: string): string {
  const fullPhone = cleanPhoneNumber(phone);
  return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Mensagem de Confirmação de Agendamento com dados completos
 */
export function generateAppointmentConfirmationMessage(
  appointment: Appointment,
  tenantName: string = 'Studio Prime'
): string {
  const dateFormatted = formatDateWithWeekday(appointment.date);
  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    cash: 'Dinheiro',
    unpaid: 'Pendente (no local)',
  };

  const paymentText =
    appointment.payment_method && appointment.payment_method !== 'unpaid'
      ? ` • ${paymentLabels[appointment.payment_method] || appointment.payment_method}`
      : ' • Pagamento no local';

  let msg = `Olá, *${appointment.customer_name}*! Tudo bem? 👋\n\n`;
  msg += `Seu agendamento no *${tenantName}* foi *CONFIRMADO* com sucesso! ✅\n\n`;
  msg += `📋 *INFORMAÇÕES DO SEU AGENDAMENTO:*\n`;
  msg += `🗓 *Data:* ${dateFormatted}\n`;
  msg += `⏰ *Horário:* ${appointment.start_time} às ${appointment.end_time} (${appointment.duration_minutes} min)\n`;
  msg += `✂️ *Serviço:* ${appointment.service_name}\n`;
  msg += `👤 *Profissional:* ${appointment.professional_name}\n`;
  msg += `💰 *Valor:* ${formatCurrency(appointment.total_price)}${paymentText}\n`;

  if (appointment.notes && appointment.notes.trim()) {
    msg += `📝 *Observações:* ${appointment.notes.trim()}\n`;
  }

  msg += `📍 *Local:* ${tenantName}\n\n`;
  msg += `Caso precise remarcar ou tenha alguma dúvida, basta nos responder por aqui com antecedência.\n\n`;
  msg += `Estamos ansiosos para te receber! ✨`;

  return msg;
}

/**
 * Mensagem de Lembrete de Agendamento com confirmação de presença (1 ou 2)
 */
export function generateAppointmentReminderMessage(
  appointment: Appointment,
  tenantName: string = 'Studio Prime'
): string {
  const dateFormatted = formatDateWithWeekday(appointment.date);

  let msg = `Olá, *${appointment.customer_name}*! Tudo bem? 👋\n\n`;
  msg += `Passando para lembrar do seu agendamento no *${tenantName}*! 🔔\n\n`;
  msg += `🗓 *Data:* ${dateFormatted}\n`;
  msg += `⏰ *Horário:* ${appointment.start_time} às ${appointment.end_time}\n`;
  msg += `✂️ *Serviço:* ${appointment.service_name}\n`;
  msg += `👤 *Profissional:* ${appointment.professional_name}\n`;
  msg += `💰 *Valor:* ${formatCurrency(appointment.total_price)}\n`;

  if (appointment.notes && appointment.notes.trim()) {
    msg += `📝 *Obs:* ${appointment.notes.trim()}\n`;
  }

  msg += `\nPodemos confirmar sua presença? Por favor, responda:\n`;
  msg += `*1* para Confirmar ✅\n`;
  msg += `*2* para Remarcar 🔄\n\n`;
  msg += `Muito obrigado e até breve! ✨`;

  return msg;
}

/**
 * Mensagem de Detalhes Completos do Atendimento
 */
export function generateAppointmentDetailsMessage(
  appointment: Appointment,
  tenantName: string = 'Studio Prime'
): string {
  const dateFormatted = formatDateWithWeekday(appointment.date);
  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    cash: 'Dinheiro',
    unpaid: 'Pendente (pagamento no local)',
  };
  const paymentStr = appointment.payment_method
    ? paymentLabels[appointment.payment_method] || appointment.payment_method
    : 'Pendente';

  let msg = `Olá, *${appointment.customer_name}*! 👋\n\n`;
  msg += `Aqui estão os detalhes do seu atendimento no *${tenantName}*:\n\n`;
  msg += `📋 *RESUMO DO ATENDIMENTO:*\n`;
  msg += `• *Cliente:* ${appointment.customer_name}\n`;
  msg += `• *Data:* ${dateFormatted}\n`;
  msg += `• *Horário:* ${appointment.start_time} às ${appointment.end_time} (${appointment.duration_minutes} min)\n`;
  msg += `• *Serviço:* ${appointment.service_name}\n`;
  msg += `• *Profissional:* ${appointment.professional_name}\n`;
  msg += `• *Forma de Pagamento:* ${paymentStr}\n`;
  msg += `• *Valor Total:* ${formatCurrency(appointment.total_price)}\n`;

  if (appointment.notes && appointment.notes.trim()) {
    msg += `• *Observações:* ${appointment.notes.trim()}\n`;
  }

  msg += `\nQualquer dúvida estamos à disposição! ✨`;

  return msg;
}

/**
 * Mensagem de Reativação ou Contato com Cliente
 */
export function generateReactivationMessage(
  customer: Customer,
  tenantName: string = 'Studio Prime',
  lastAppointment?: Appointment
): string {
  if (lastAppointment) {
    return `Olá, *${customer.name}*! Sentimos sua falta aqui no *${tenantName}*! 💖\n\nSeu último atendimento conosco foi de *${lastAppointment.service_name}* em ${formatDate(lastAppointment.date)}.\n\nQue tal renovar seu visual esta semana? Preparamos horários especiais para você! Responda esta mensagem para escolher o seu melhor dia e horário. ✨`;
  }
  return `Olá, *${customer.name}*! Sentimos sua falta aqui no *${tenantName}*! 💖\n\nPreparamos uma condição especial para você renovar seu visual esta semana. Que tal agendarmos um horário especial?\n\nResponda esta mensagem para escolher o seu melhor dia e horário! ✨`;
}

/**
 * Função utilitária para abrir a API do WhatsApp redirecionando o navegador com a mensagem pronta
 * e gravando o envio no histórico de automações.
 */
export function openWhatsAppForAppointment(
  appointment: Appointment,
  tenantName: string = 'Studio Prime',
  type: 'confirmation' | 'reminder' | 'details' = 'confirmation'
): string {
  let message = '';
  let templateName = '';

  switch (type) {
    case 'reminder':
      message = generateAppointmentReminderMessage(appointment, tenantName);
      templateName = 'Lembrete de Horário';
      break;
    case 'details':
      message = generateAppointmentDetailsMessage(appointment, tenantName);
      templateName = 'Detalhes do Atendimento';
      break;
    case 'confirmation':
    default:
      message = generateAppointmentConfirmationMessage(appointment, tenantName);
      templateName = 'Confirmação de Agendamento';
      break;
  }

  const link = createWhatsAppLink(appointment.customer_phone, message);

  // Registra envio no histórico da store de WhatsApp
  try {
    useWhatsAppStore.getState().sendMessage(
      appointment.customer_name,
      appointment.customer_phone,
      message,
      templateName,
      appointment.id
    );
  } catch (err) {
    // silencioso caso o store não esteja disponível
  }

  if (typeof window !== 'undefined') {
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  return link;
}
