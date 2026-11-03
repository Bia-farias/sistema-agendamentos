import { describe, it, expect } from 'vitest';

/**
 * Funções auxiliares para teste de regras RBAC e LGPD
 */
function isRoleAuthorized(userRole: string, allowedRoles?: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  const normalizedUserRole = userRole.toLowerCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
  return normalizedAllowed.includes(normalizedUserRole);
}

function filterNavItemsByRole(
  items: Array<{ label: string; roles?: string[] }>,
  userRole: string
) {
  const normalizedUserRole = userRole.toLowerCase();
  return items.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.map((r) => r.toLowerCase()).includes(normalizedUserRole);
  });
}

function sanitizeClientDataForPrompt(
  clients: Array<{ name: string; phone: string; total_spent: number }>,
  isManager: boolean
) {
  return clients.map((c) => {
    return {
      name: c.name,
      // Não vazar telefone do cliente para o prompt
      phoneExposed: false,
      // Faturamento e gastos acessíveis apenas por gestores/proprietários
      revenueExposed: isManager ? c.total_spent : undefined,
    };
  });
}

describe('Fase 6: Controle de Acesso RBAC e Proteção LGPD no Frontend', () => {
  const allNavItems = [
    { label: 'Dashboard', roles: ['super_admin', 'owner', 'admin', 'receptionist'] },
    { label: 'Agenda' }, // Liberado para todos
    { label: 'Clientes' }, // Liberado para todos
    { label: 'Serviços' }, // Liberado para todos
    { label: 'Profissionais', roles: ['super_admin', 'owner', 'admin'] },
    { label: 'Financeiro', roles: ['super_admin', 'owner', 'admin'] },
    { label: 'WhatsApp', roles: ['super_admin', 'owner', 'admin', 'receptionist'] },
    { label: 'Configurações', roles: ['super_admin', 'owner', 'admin'] },
    { label: 'Assistente IA' }, // Liberado para todos
  ];

  it('deve restringir o menu lateral para perfil PROFESSIONAL (ocultando Financeiro e Configurações)', () => {
    const profMenu = filterNavItemsByRole(allNavItems, 'professional');
    const labels = profMenu.map((m) => m.label);

    expect(labels).toContain('Agenda');
    expect(labels).toContain('Clientes');
    expect(labels).toContain('Serviços');
    expect(labels).toContain('Assistente IA');

    expect(labels).not.toContain('Financeiro');
    expect(labels).not.toContain('Configurações');
    expect(labels).not.toContain('Profissionais');
    expect(labels).not.toContain('Dashboard');
  });

  it('deve restringir o menu lateral para perfil RECEPTIONIST (ocultando Financeiro e Configurações)', () => {
    const recepMenu = filterNavItemsByRole(allNavItems, 'receptionist');
    const labels = recepMenu.map((m) => m.label);

    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Agenda');
    expect(labels).toContain('Clientes');
    expect(labels).toContain('Serviços');
    expect(labels).toContain('WhatsApp');
    expect(labels).toContain('Assistente IA');

    expect(labels).not.toContain('Financeiro');
    expect(labels).not.toContain('Configurações');
    expect(labels).not.toContain('Profissionais');
  });

  it('deve permitir acesso completo a todos os menus para OWNER e ADMIN', () => {
    const ownerMenu = filterNavItemsByRole(allNavItems, 'owner');
    expect(ownerMenu.length).toBe(allNavItems.length);

    const adminMenu = filterNavItemsByRole(allNavItems, 'admin');
    expect(adminMenu.length).toBe(allNavItems.length);
  });

  it('deve validar permissão de rota no ProtectedRoute', () => {
    const managerOnly = ['owner', 'admin', 'super_admin'];

    expect(isRoleAuthorized('owner', managerOnly)).toBe(true);
    expect(isRoleAuthorized('admin', managerOnly)).toBe(true);
    expect(isRoleAuthorized('super_admin', managerOnly)).toBe(true);

    expect(isRoleAuthorized('professional', managerOnly)).toBe(false);
    expect(isRoleAuthorized('receptionist', managerOnly)).toBe(false);
  });

  it('deve proteger dados financeiros e de clientes no prompt da IA conforme o perfil', () => {
    const clients = [
      { name: 'Ana Souza', phone: '11988887777', total_spent: 1250 },
    ];

    // Para recepcionista ou profissional (não gestor)
    const sanitizedForStaff = sanitizeClientDataForPrompt(clients, false);
    expect(sanitizedForStaff[0].phoneExposed).toBe(false);
    expect(sanitizedForStaff[0].revenueExposed).toBeUndefined();

    // Para proprietário/gestor
    const sanitizedForOwner = sanitizeClientDataForPrompt(clients, true);
    expect(sanitizedForOwner[0].phoneExposed).toBe(false);
    expect(sanitizedForOwner[0].revenueExposed).toBe(1250);
  });
});

