"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = adminOnly;
const client_1 = require("../prisma/client");
async function adminOnly(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await client_1.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
    });
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin only' });
    }
    return next();
}
