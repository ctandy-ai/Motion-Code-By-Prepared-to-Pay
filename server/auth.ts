import { Request, Response, NextFunction, RequestHandler } from 'express';
import { USER_ROLES } from '@shared/schema';

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

declare global {
  namespace Express {
    interface Request {
      coachId?: string;
      userRole?: UserRole;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const coachId = req.header('x-coach-id') || 'default-coach';
  req.coachId = coachId;
  
  const user = (req as any).user;
  if (user?.role) {
    req.userRole = user.role as UserRole;
  } else {
    // Default to ATHLETE (least-privileged) for unauthenticated/unknown users
    req.userRole = USER_ROLES.ATHLETE;
  }
  
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.coachId) {
    return res.status(401).json({ error: 'Unauthorized - No coach ID provided' });
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Default to ATHLETE (least-privileged) if userRole is not set
    const userRole = req.userRole || USER_ROLES.ATHLETE;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        requiredRoles: allowedRoles,
        currentRole: userRole
      });
    }
    
    next();
  };
}

export function requireHeadCoach(req: Request, res: Response, next: NextFunction) {
  const allowedRoles: UserRole[] = [USER_ROLES.HEAD_COACH, USER_ROLES.ADMIN];
  // Default to ATHLETE (least-privileged) if userRole is not set
  const userRole = req.userRole || USER_ROLES.ATHLETE;
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This action requires Head Coach or Admin privileges',
      currentRole: userRole
    });
  }
  
  next();
}

export function requireCoach(req: Request, res: Response, next: NextFunction) {
  const coachRoles: UserRole[] = [USER_ROLES.HEAD_COACH, USER_ROLES.ASSISTANT_COACH, USER_ROLES.ADMIN];
  // Default to ATHLETE (least-privileged) if userRole is not set
  const userRole = req.userRole || USER_ROLES.ATHLETE;
  
  if (!coachRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This action requires Coach privileges',
      currentRole: userRole
    });
  }
  
  next();
}

export function getPermissions(role: UserRole): {
  canManageAthletes: boolean;
  canManagePrograms: boolean;
  canDeleteAthletes: boolean;
  canBroadcastMessages: boolean;
  canAccessAI: boolean;
  canManageTeams: boolean;
  canViewAnalytics: boolean;
  canEditSettings: boolean;
  canAssignPrograms: boolean;
} {
  switch (role) {
    case USER_ROLES.ADMIN:
      return {
        canManageAthletes: true,
        canManagePrograms: true,
        canDeleteAthletes: true,
        canBroadcastMessages: true,
        canAccessAI: true,
        canManageTeams: true,
        canViewAnalytics: true,
        canEditSettings: true,
        canAssignPrograms: true,
      };
    case USER_ROLES.HEAD_COACH:
      return {
        canManageAthletes: true,
        canManagePrograms: true,
        canDeleteAthletes: true,
        canBroadcastMessages: true,
        canAccessAI: true,
        canManageTeams: true,
        canViewAnalytics: true,
        canEditSettings: true,
        canAssignPrograms: true,
      };
    case USER_ROLES.ASSISTANT_COACH:
      return {
        canManageAthletes: true,
        canManagePrograms: true,
        canDeleteAthletes: false,
        canBroadcastMessages: false,
        canAccessAI: true,
        canManageTeams: false,
        canViewAnalytics: true,
        canEditSettings: false,
        canAssignPrograms: true,
      };
    case USER_ROLES.ATHLETE:
      return {
        canManageAthletes: false,
        canManagePrograms: false,
        canDeleteAthletes: false,
        canBroadcastMessages: false,
        canAccessAI: false,
        canManageTeams: false,
        canViewAnalytics: false,
        canEditSettings: false,
        canAssignPrograms: false,
      };
    default:
      return {
        canManageAthletes: false,
        canManagePrograms: false,
        canDeleteAthletes: false,
        canBroadcastMessages: false,
        canAccessAI: false,
        canManageTeams: false,
        canViewAnalytics: false,
        canEditSettings: false,
        canAssignPrograms: false,
      };
  }
}

export { USER_ROLES, UserRole };
