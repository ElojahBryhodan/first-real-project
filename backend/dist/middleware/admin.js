"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
exports.requireAdmin = requireAdmin;
exports.requireSuperAdmin = requireSuperAdmin;
const client_1 = require("../prisma/client");
async function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await client_1.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
    });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
}
async function requireSuperAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await client_1.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
    });
    if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
}
// Legacy export for backward compatibility
exports.adminOnly = requireAdmin;
