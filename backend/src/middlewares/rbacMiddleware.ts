import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';
import { sendError } from '../utils/response.js';

// Hierarquia de níveis de acesso
const roleHierarchy: Record<string, string[]> = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'],
  OWNER: ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'],
  ADMIN: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'],
  PROFESSIONAL: ['PROFESSIONAL'],
  RECEPTIONIST: ['RECEPTIONIST'],
};

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

    const effectiveRoles = roleHierarchy[userRole] || [userRole];
    const hasPermission = normalizedAllowedRoles.some((role) =>
      effectiveRoles.includes(role)
    );

    if (!hasPermission) {
      return sendError(
        res,
        'Acesso negado. Seu perfil de usuário não possui permissão para este recurso.',
        403
      );
    }

    return next();
  };
}
