"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../prisma/client");
const env_1 = require("../utils/env");
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
const authSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.authRouter.post('/register', async (req, res, next) => {
    try {
        const parsed = authSchema.parse(req.body);
        const existing = await client_1.prisma.user.findUnique({
            where: { email: parsed.email },
        });
        if (existing) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        const passwordHash = await bcrypt_1.default.hash(parsed.password, 10);
        const user = await client_1.prisma.user.create({
            data: {
                email: parsed.email,
                passwordHash,
                username: parsed.email.split('@')[0],
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        console.log('[ledger] New user registered', { userId: user.id, email: user.email });
        return res.status(201).json({ token });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        return next(err);
    }
});
exports.authRouter.post('/login', async (req, res, next) => {
    try {
        const parsed = authSchema.parse(req.body);
        const user = await client_1.prisma.user.findUnique({
            where: { email: parsed.email },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const ok = await bcrypt_1.default.compare(parsed.password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET, {
            expiresIn: '7d',
        });
        return res.json({ token });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        return next(err);
    }
});
exports.authRouter.get('/me', auth_1.authMiddleware, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await client_1.prisma.user.findUnique({
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
    }
    catch (err) {
        return next(err);
    }
});
