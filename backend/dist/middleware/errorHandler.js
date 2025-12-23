"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
// Simple centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, _req, res, _next) {
    console.error('[error]', err);
    if (res.headersSent) {
        return;
    }
    res.status(500).json({ error: 'Internal server error' });
}
