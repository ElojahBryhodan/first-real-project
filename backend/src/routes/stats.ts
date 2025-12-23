import { Router } from 'express';
import { prisma } from '../prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

export const statsRouter = Router();

statsRouter.get('/', authMiddleware, async (_req: AuthenticatedRequest, res, next) => {
  try {
    const [totalMatches, totalVolume] = await Promise.all([
      prisma.match.count(),
      prisma.match.aggregate({
        _sum: {
          entryFeeCents: true,
        },
        where: {
          status: 'FINISHED',
        },
      }),
    ]);

    // Calculate total volume: sum of all entry fees from finished matches (both players paid)
    const finishedMatchesCount = await prisma.match.count({
      where: { status: 'FINISHED' },
    });
    const totalVolumeCents = (totalVolume._sum.entryFeeCents || 0) * 2; // Both players paid

    return res.json({
      totalMatches,
      totalVolumeCents,
      finishedMatches: finishedMatchesCount,
    });
  } catch (err) {
    return next(err);
  }
});

