import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      coachId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const coachId = req.header('x-coach-id') || 'default-coach';
  req.coachId = coachId;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.coachId) {
    return res.status(401).json({ error: 'Unauthorized - No coach ID provided' });
  }
  next();
}
