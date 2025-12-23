"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("../prisma/client");
const auth_1 = require("../middleware/auth");
exports.matchesRouter = (0, express_1.Router)();
const createMatchSchema = zod_1.z.object({
    game: zod_1.z.string().min(1),
    entryFeeCents: zod_1.z.number().int().nonnegative().optional(),
});
exports.matchesRouter.get('/', auth_1.authMiddleware, async (_req, res, next) => {
    try {
        const matches = await client_1.prisma.match.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
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
    }
    catch (err) {
        return next(err);
    }
});
exports.matchesRouter.get('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const matchId = req.params.id;
        const match = await client_1.prisma.match.findUnique({
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
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }
        return res.json({ match });
    }
    catch (err) {
        return next(err);
    }
});
exports.matchesRouter.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const parsed = createMatchSchema.parse(req.body);
        const userId = req.user.userId;
        // Read platform config for default entry fee
        const config = await client_1.prisma.platformConfig.findUnique({
            where: { id: 1 },
        });
        const defaultEntryFeeCents = config?.defaultEntryFeeCents ?? 500;
        const entryFeeCents = parsed.entryFeeCents ?? defaultEntryFeeCents;
        // All money operations inside DB transaction
        const result = await client_1.prisma.$transaction(async (tx) => {
            // Get current user with balance (only needed if entryFeeCents > 0)
            let updatedUser = null;
            if (entryFeeCents > 0) {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { balanceCents: true },
                });
                if (!user) {
                    throw new Error('User not found');
                }
                // No negative balances ever
                if (user.balanceCents < entryFeeCents) {
                    throw new Error('Insufficient balance');
                }
                // Deduct entry fee from user balance
                updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: {
                        balanceCents: {
                            decrement: entryFeeCents,
                        },
                    },
                    select: { balanceCents: true },
                });
            }
            // Create match
            const match = await tx.match.create({
                data: {
                    game: parsed.game,
                    entryFeeCents,
                    createdById: userId,
                },
            });
            // Create ledger entry for entry fee (only if entryFeeCents > 0)
            if (entryFeeCents > 0) {
                await tx.ledgerEntry.create({
                    data: {
                        userId: userId,
                        type: 'ENTRY_FEE',
                        amountCents: -entryFeeCents, // Negative because it's a deduction
                        matchId: match.id,
                    },
                });
            }
            return { match, updatedUser };
        });
        console.log('[match] Created', {
            matchId: result.match.id,
            createdById: result.match.createdById,
            entryFeeCents: result.match.entryFeeCents,
            userId: userId,
            newBalanceCents: result.updatedUser?.balanceCents ?? 'N/A (free match)',
        });
        return res.status(201).json({ match: result.match });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        if (err instanceof Error && err.message === 'Insufficient balance') {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        return next(err);
    }
});
exports.matchesRouter.post('/:id/join', auth_1.authMiddleware, async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const matchId = req.params.id;
        const userId = req.user.userId;
        // All operations inside DB transaction
        const result = await client_1.prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: { id: matchId },
            });
            if (!match) {
                throw new Error('Match not found');
            }
            // Strict match lifecycle: only WAITING matches can be joined
            if (match.status !== 'WAITING') {
                throw new Error('Match is not available for joining');
            }
            // Cannot join your own match
            if (match.createdById === userId) {
                throw new Error('Cannot join your own match');
            }
            // Match already has a participant
            if (match.joinedById) {
                throw new Error('Match already has a participant');
            }
            // Double requests must not double-pay: check if user already joined
            // (This is already handled by joinedById check above, but keeping for clarity)
            let updatedUser = null;
            // If entry fee > 0, deduct from balance
            if (match.entryFeeCents > 0) {
                const user = await tx.user.findUnique({
                    where: { id: userId },
                    select: { balanceCents: true },
                });
                if (!user) {
                    throw new Error('User not found');
                }
                // No negative balances ever
                if (user.balanceCents < match.entryFeeCents) {
                    throw new Error('Insufficient balance');
                }
                // Deduct entry fee from user balance
                updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: {
                        balanceCents: {
                            decrement: match.entryFeeCents,
                        },
                    },
                    select: { balanceCents: true },
                });
                // Create ledger entry for entry fee
                await tx.ledgerEntry.create({
                    data: {
                        userId: userId,
                        type: 'ENTRY_FEE',
                        amountCents: -match.entryFeeCents, // Negative because it's a deduction
                        matchId: match.id,
                    },
                });
            }
            // Update match: set joinedById and change status to IN_PROGRESS
            const updated = await tx.match.update({
                where: { id: matchId },
                data: {
                    joinedById: userId,
                    status: 'IN_PROGRESS',
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
                },
            });
            return { match: updated, updatedUser };
        });
        console.log('[match] Joined', {
            matchId: result.match.id,
            joinedById: result.match.joinedById,
            userId: userId,
            entryFeeCents: result.match.entryFeeCents,
            newBalanceCents: result.updatedUser?.balanceCents ?? 'N/A (free match)',
        });
        return res.json({ match: result.match });
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.message === 'Match not found') {
                return res.status(404).json({ error: 'Match not found' });
            }
            if (err.message === 'Match is not available for joining') {
                return res.status(400).json({ error: 'Match is not available for joining' });
            }
            if (err.message === 'Cannot join your own match') {
                return res.status(400).json({ error: 'Cannot join your own match' });
            }
            if (err.message === 'Match already has a participant') {
                return res.status(400).json({ error: 'Match already has a participant' });
            }
            if (err.message === 'Insufficient balance') {
                return res.status(400).json({ error: 'Insufficient balance' });
            }
        }
        return next(err);
    }
});
const finishMatchSchema = zod_1.z.object({
    winnerId: zod_1.z.string().uuid(),
});
exports.matchesRouter.post('/:id/finish', auth_1.authMiddleware, async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const matchId = req.params.id;
        const parsed = finishMatchSchema.parse(req.body);
        // All operations inside DB transaction
        const result = await client_1.prisma.$transaction(async (tx) => {
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
            // Strict match lifecycle: only IN_PROGRESS matches can be finished
            if (match.status !== 'IN_PROGRESS') {
                throw new Error('Match is not in progress');
            }
            // Verify winnerId is one of the participants
            const isParticipant = match.createdById === parsed.winnerId ||
                match.joinedById === parsed.winnerId;
            if (!isParticipant) {
                throw new Error('Winner must be a participant');
            }
            // Calculate prize and commission
            const totalEntryFees = match.entryFeeCents * 2; // Both players paid
            const config = await tx.platformConfig.findUnique({
                where: { id: 1 },
            });
            const commissionBps = config?.commissionBps ?? 500; // Default 5%
            const commissionCents = Math.floor((totalEntryFees * commissionBps) / 10000);
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
            const loserId = match.createdById === parsed.winnerId
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
            // Create ledger entry for commission (if > 0)
            if (commissionCents > 0) {
                // Commission goes to platform (no specific user, but we can track it)
                // For now, we'll create a ledger entry with a system user or skip it
                // Since we don't have a system user, we'll skip commission ledger entry
                // (commission is tracked in match.commissionCents)
            }
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
        console.log('[match] Finished', {
            matchId: result.match.id,
            winnerId: result.match.winnerId,
            prizeCents: result.match.prizeCents,
            commissionCents: result.match.commissionCents,
        });
        return res.json({ match: result.match });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        if (err instanceof Error) {
            if (err.message === 'Match not found') {
                return res.status(404).json({ error: 'Match not found' });
            }
            if (err.message === 'Match is not in progress') {
                return res.status(400).json({ error: 'Match is not in progress' });
            }
            if (err.message === 'Winner must be a participant') {
                return res.status(400).json({ error: 'Winner must be a participant' });
            }
        }
        return next(err);
    }
});
exports.matchesRouter.post('/:id/dispute', auth_1.authMiddleware, async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const matchId = req.params.id;
        const userId = req.user.userId;
        const match = await client_1.prisma.match.findUnique({
            where: { id: matchId },
        });
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }
        const isParticipant = match.createdById === userId || match.joinedById === userId;
        if (!isParticipant) {
            return res.status(403).json({ error: 'Only participants can dispute a match' });
        }
        if (match.status === 'DISPUTE') {
            // Idempotent: already in dispute, just return current state
            return res.json({ match });
        }
        // Minimal lifecycle rule: only allow disputes for matches that have started
        if (match.status === 'WAITING') {
            return res.status(400).json({ error: 'Cannot dispute a match that has not started' });
        }
        const updated = await client_1.prisma.match.update({
            where: { id: matchId },
            data: {
                status: 'DISPUTE',
            },
        });
        console.log('[match] Disputed', { matchId: updated.id, userId });
        return res.json({ match: updated });
    }
    catch (err) {
        return next(err);
    }
});
