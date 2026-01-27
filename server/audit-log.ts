import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { auditLogs, InsertAuditLog } from '@shared/schema';

export type AuditAction = 
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  | 'LOGIN' | 'LOGOUT' 
  | 'ASSIGN_PROGRAM' | 'UNASSIGN_PROGRAM'
  | 'BROADCAST_MESSAGE' | 'SEND_MESSAGE'
  | 'BULK_ASSIGN' | 'BULK_MESSAGE'
  | 'AI_QUERY' | 'AI_UPDATE' | 'AI_RECOMMENDATION'
  | 'IMPORT_CSV' | 'EXPORT_DATA'
  | 'APPROVE_AI_ACTION' | 'REJECT_AI_ACTION';

export type ResourceType = 
  | 'ATHLETE' | 'PROGRAM' | 'EXERCISE' | 'WORKOUT_LOG'
  | 'MESSAGE' | 'TEAM' | 'USER' | 'SETTINGS'
  | 'AI_ACTION' | 'REPORT' | 'WELLNESS_SURVEY'
  | 'TRAINING_BLOCK' | 'PROGRAM_PHASE';

interface AuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string | null;
  resourceName?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string | null;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: params.success !== false ? 1 : 0,
      errorMessage: params.errorMessage,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

export function extractRequestInfo(req: Request): {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
} {
  const user = (req as any).user;
  return {
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.role || req.userRole,
    ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || undefined,
    userAgent: req.headers['user-agent'] || undefined,
  };
}

export function createAuditMiddleware(
  action: AuditAction,
  resourceType: ResourceType,
  getResourceInfo?: (req: Request) => { resourceId?: string; resourceName?: string; details?: string }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send.bind(res);
    
    res.send = function(body: any) {
      const reqInfo = extractRequestInfo(req);
      const resourceInfo = getResourceInfo ? getResourceInfo(req) : {};
      
      logAudit({
        ...reqInfo,
        action,
        resourceType,
        resourceId: resourceInfo.resourceId || req.params.id,
        resourceName: resourceInfo.resourceName,
        details: resourceInfo.details,
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? body?.error || body?.message : undefined,
      });
      
      return originalSend(body);
    };
    
    next();
  };
}

export function auditLog(
  req: Request,
  action: AuditAction,
  resourceType: ResourceType,
  options: {
    resourceId?: string;
    resourceName?: string;
    details?: string;
    success?: boolean;
    errorMessage?: string;
  } = {}
): void {
  const reqInfo = extractRequestInfo(req);
  
  logAudit({
    ...reqInfo,
    action,
    resourceType,
    resourceId: options.resourceId,
    resourceName: options.resourceName,
    details: options.details,
    success: options.success,
    errorMessage: options.errorMessage,
  });
}
