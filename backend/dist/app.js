"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./utils/env");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./routes/auth");
const matches_1 = require("./routes/matches");
const stats_1 = require("./routes/stats");
const admin_1 = require("./routes/admin");
const superAdmin_1 = require("./routes/superAdmin");
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
exports.app.use((0, cors_1.default)({
    origin: env_1.env.CORS_ORIGIN,
    credentials: true,
}));
exports.app.use((0, helmet_1.default)());
exports.app.use((0, morgan_1.default)('dev'));
exports.app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
exports.app.use('/api/auth', auth_1.authRouter);
exports.app.use('/api/matches', matches_1.matchesRouter);
exports.app.use('/api/stats', stats_1.statsRouter);
exports.app.use('/api/admin', admin_1.adminRouter);
exports.app.use('/api/super-admin', superAdmin_1.superAdminRouter);
exports.app.use(errorHandler_1.errorHandler);
