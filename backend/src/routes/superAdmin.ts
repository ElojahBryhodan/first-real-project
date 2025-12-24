import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/admin';

export const superAdminRouter = Router();

const updateRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

superAdminRouter.patch(
  '/users/:id/role',
  authMiddleware,
  requireSuperAdmin,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const targetUserId = req.params.id;
      const parsed = updateRoleSchema.parse(req.body);

      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const actorUserId = req.user.userId;

      // Get target user
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, role: true },
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate role transitions - cannot change SUPER_ADMIN role
      if (targetUser.role === 'SUPER_ADMIN') {
        return res.status(400).json({
          error: 'Cannot change role of SUPER_ADMIN user',
        });
      }

      // Prevent self-demotion if actor is trying to demote themselves and they're the last SUPER_ADMIN
      // Note: This shouldn't happen through this endpoint since SUPER_ADMIN can't change their own role,
      // but it's a safety check in case the logic changes in the future
      if (targetUserId === actorUserId) {
        const otherSuperAdmins = await prisma.user.count({
          where: {
            role: 'SUPER_ADMIN',
            id: { not: actorUserId },
          },
        });

        if (otherSuperAdmins === 0) {
          return res.status(400).json({
            error: 'Cannot demote yourself: you are the last SUPER_ADMIN',
          });
        }
      }

      if (targetUser.role === parsed.role) {
        return res.status(400).json({
          error: `User already has role ${parsed.role}`,
        });
      }

      // Validate allowed transitions: USER → ADMIN, ADMIN → USER
      if (
        (targetUser.role === 'USER' && parsed.role !== 'ADMIN') ||
        (targetUser.role === 'ADMIN' && parsed.role !== 'USER')
      ) {
        return res.status(400).json({
          error: `Invalid role transition: ${targetUser.role} → ${parsed.role}`,
        });
      }

      const oldRole = targetUser.role;
      const newRole = parsed.role;

      // Update user role
      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });

      // Log role change
      const timestamp = new Date().toISOString();
      console.log('[super-admin] Role changed', {
        actorUserId,
        targetUserId,
        targetEmail: targetUser.email,
        oldRole,
        newRole,
        timestamp,
      });

      return res.json({ user: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      return next(err);
    }
  },
);

