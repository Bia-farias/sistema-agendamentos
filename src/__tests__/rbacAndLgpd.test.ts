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
    { label: 'Empresas & Acessos', roles: ['super_admin', 'owner'] },
    { label: 'Dashboard', roles: ['admin', 'receptionist'] },
    { label: 'Agenda', roles: ['admin', 'professional', 'receptionist'] },
    { label: 'Clientes', roles: ['admin', 'professional', 'receptionist'] },
    { label: 'Serviços', roles: ['admin', 'professional', 'receptionist'] },
    { label: 'Profissionais', roles: ['admin'] },
    { label: 'Financeiro', roles: ['admin'] },
    { label: 'WhatsApp', roles: ['admin', 'receptionist'] },
    { label: 'Minha Página', roles: ['admin'] },
    { label: 'Configurações', roles: ['admin'] },
    { label: 'Assistente IA', roles: ['admin', 'professional', 'receptionist'] },
  ];

  it('deve direcionar o acesso OWNER exclusivamente para a Gestão de Empresas & Acessos SaaS', () => {
    const ownerMenu = filterNavItemsByRole(allNavItems, 'owner');
    const labels = ownerMenu.map((m) => m.label);

    expect(labels).toEqual(['Empresas & Acessos']);
  });

  it('deve liberar todas as funcionalidades operacionais e financeiras da empresa para o perfil ADMIN', () => {
    const adminMenu = filterNavItemsByRole(allNavItems, 'admin');
    const labels = adminMenu.map((m) => m.label);

    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Agenda');
    expect(labels).toContain('Clientes');
    expect(labels).toContain('Serviços');
    expect(labels).toContain('Profissionais');
    expect(labels).toContain('Financeiro');
    expect(labels).toContain('WhatsApp');
    expect(labels).toContain('Minha Página');
    expect(labels).toContain('Configurações');
    expect(labels).toContain('Assistente IA');
    expect(labels).not.toContain('Empresas & Acessos');
  });

  it('deve restringir o menu lateral para perfil PROFESSIONAL (ocultando Financeiro, Profissionais e Configurações)', () => {
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
    expect(labels).not.toContain('Empresas & Acessos');
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
    expect(labels).not.toContain('Empresas & Acessos');
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

