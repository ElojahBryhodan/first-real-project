"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("../prisma/client");
const auth_1 = require("../middleware/auth");
const admin_1 = require("../middleware/admin");
exports.adminRouter = (0, express_1.Router)();
const resolveSchema = zod_1.z.object({
    winnerId: zod_1.z.string().uuid(),
});
exports.adminRouter.post('/matches/:id/resolve', auth_1.authMiddleware, admin_1.adminOnly, async (req, res, next) => {
    try {
        const matchId = req.params.id;
        const parsed = resolveSchema.parse(req.body);
        const result = await client_1.prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: { id: matchId },
            });
            if (!match) {
                return { status: 404, body: { error: 'Match not found' } };
            }
            if (match.status === 'FINISHED') {
                // Idempotent: already finished, just return it
                return { status: 200, body: { match } };
            }
            if (match.status !== 'DISPUTE') {
                return {
                    status: 400,
                    body: { error: 'Only disputed matches can be resolved by admin' },
                };
            }
            // Winner must be a participant
            if (parsed.winnerId !== match.createdById &&
                parsed.winnerId !== match.joinedById) {
                return {
                    status: 400,
                    body: { error: 'Winner must be one of the participants' },
                };
            }
            const updated = await tx.match.update({
                where: { id: matchId },
                data: {
                    status: 'FINISHED',
                    winnerId: parsed.winnerId,
                },
            });
            console.log('[match] Dispute resolved by admin', {
                matchId: updated.id,
                winnerId: updated.winnerId,
            });
            return { status: 200, body: { match: updated } };
        });
        return res.status(result.status).json(result.body);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        return next(err);
    }
});
