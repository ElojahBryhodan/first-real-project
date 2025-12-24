import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

export const adminRouter = Router();

const resolveSchema = z.object({
  winnerId: z.string().uuid(),
});

adminRouter.get('/matches', authMiddleware, requireAdmin, async (_req: AuthenticatedRequest, res, next) => {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        joinedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        winner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    return res.json({ matches });
  } catch (err) {
    return next(err);
  }
});

adminRouter.get('/users', authMiddleware, requireAdmin, async (_req: AuthenticatedRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

adminRouter.get('/config', authMiddleware, requireAdmin, async (_req: AuthenticatedRequest, res, next) => {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { id: 1 },
    });

    // If config doesn't exist, return defaults
    if (!config) {
      return res.json({
        config: {
          id: 1,
          defaultEntryFeeCents: 500,
          commissionBps: 500,
        },
      });
    }

    return res.json({ config });
  } catch (err) {
    return next(err);
  }
});

const updateCommissionSchema = z.object({
  commissionBps: z.number().int().min(0).max(10000), // 0-100% in basis points
});

adminRouter.put('/config/commission', authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res, next) => {
  try {
    const parsed = updateCommissionSchema.parse(req.body);

    // Update or create platform config (id is always 1)
    const config = await prisma.platformConfig.upsert({
      where: { id: 1 },
      update: {
        commissionBps: parsed.commissionBps,
      },
      create: {
        id: 1,
        commissionBps: parsed.commissionBps,
        defaultEntryFeeCents: 500, // Default value
      },
    });

    console.log('[admin] Commission updated', {
      commissionBps: config.commissionBps,
      commissionPercent: (config.commissionBps / 100).toFixed(2),
    });

    return res.json({ config });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    return next(err);
  }
});

adminRouter.post(
  '/matches/:id/resolve',
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const matchId = req.params.id;
      const parsed = resolveSchema.parse(req.body);

      // All operations inside DB transaction
      const result = await prisma.$transaction(async (tx) => {
        const match = await tx.match.findUnique({
          where: { id: matchId },
        });

        if (!match) {
          throw new Error('Match not found');
        }

        // Payout must happen exactly once: check if already finished
        if (match.status === 'FINISHED') {
          // Idempotent: already finished, return current state
          const finishedMatch = await tx.match.findUnique({
            where: { id: matchId },
            include: {
              createdBy: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
              joinedBy: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
              winner: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          });
          if (finishedMatch) {
            return { match: finishedMatch };
          }
        }

        // Only DISPUTE matches can be resolved by admin
        if (match.status !== 'DISPUTE') {
          throw new Error('Only disputed matches can be resolved by admin');
        }

        // Verify winnerId is one of the participants
        const isParticipant =
          match.createdById === parsed.winnerId ||
          match.joinedById === parsed.winnerId;

        if (!isParticipant) {
          throw new Error('Winner must be a participant');
        }

        // Calculate prize and commission (same logic as finish)
        const totalEntryFees = match.entryFeeCents * 2; // Both players paid
        const config = await tx.platformConfig.findUnique({
          where: { id: 1 },
        });
        const commissionBps = config?.commissionBps ?? 500; // Default 5%
        const commissionCents = Math.floor(
          (totalEntryFees * commissionBps) / 10000
        );
        const prizeCents = totalEntryFees - commissionCents;

        // Pay winner
        const winner = await tx.user.findUnique({
          where: { id: parsed.winnerId },
          select: { balanceCents: true, wins: true, losses: true },
        });

        if (!winner) {
          throw new Error('Winner not found');
        }

        // Update winner: add prize, increment wins
        await tx.user.update({
          where: { id: parsed.winnerId },
          data: {
            balanceCents: {
              increment: prizeCents,
            },
            wins: {
              increment: 1,
            },
          },
        });

        // Update loser: increment losses
        const loserId =
          match.createdById === parsed.winnerId
            ? match.joinedById
            : match.createdById;

        if (loserId) {
          await tx.user.update({
            where: { id: loserId },
            data: {
              losses: {
                increment: 1,
              },
            },
          });
        }

        // Create ledger entry for win payout
        await tx.ledgerEntry.create({
          data: {
            userId: parsed.winnerId,
            type: 'WIN_PAYOUT',
            amountCents: prizeCents, // Positive because it's a credit
            matchId: match.id,
          },
        });

        // Update match: set status, winnerId, prizeCents, commissionCents
        const updated = await tx.match.update({
          where: { id: matchId },
          data: {
            status: 'FINISHED',
            winnerId: parsed.winnerId,
            prizeCents,
            commissionCents,
          },
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            joinedBy: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            winner: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        });

        return { match: updated };
      });

      console.log('[match] Dispute resolved by admin', {
        matchId: result.match.id,
        winnerId: result.match.winnerId,
        prizeCents: result.match.prizeCents,
        commissionCents: result.match.commissionCents,
      });

      return res.json({ match: result.match });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      if (err instanceof Error) {
        if (err.message === 'Match not found') {
          return res.status(404).json({ error: 'Match not found' });
        }
        if (err.message === 'Only disputed matches can be resolved by admin') {
          return res.status(400).json({ error: 'Only disputed matches can be resolved by admin' });
        }
        if (err.message === 'Winner must be a participant') {
          return res.status(400).json({ error: 'Winner must be a participant' });
        }
      }
      return next(err);
    }
  },
);


