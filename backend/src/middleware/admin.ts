import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../prisma/client';

export async function adminOnly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin only' });
  }

  return next();
}


