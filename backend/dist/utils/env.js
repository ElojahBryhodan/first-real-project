"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 4000),
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
if (!exports.env.DATABASE_URL) {
    // eslint-disable-next-line no-console
    console.warn('[env] DATABASE_URL is not set. Prisma will fail to connect.');
}
