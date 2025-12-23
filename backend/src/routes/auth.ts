import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { env } from '../utils/env';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = authSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        passwordHash,
        username: parsed.email.split('@')[0],
      },
    });

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('[ledger] New user registered', { userId: user.id, email: user.email });

    return res.status(201).json({ token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    return next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = authSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({ token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    return next(err);
  }
});

authRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        balanceCents: true,
        wins: true,
        losses: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


