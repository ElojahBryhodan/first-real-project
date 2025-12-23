import { NextFunction, Request, Response } from 'express';

// Simple centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[error]', err);

  if (res.headersSent) {
    return;
  }

  // Provide more context in error messages
  if (err instanceof Error) {
    // Database errors
    if (err.message.includes('Unique constraint')) {
      return res.status(409).json({ error: 'Цей запис вже існує' });
    }
    if (err.message.includes('Foreign key constraint')) {
      return res.status(400).json({ error: 'Невірне посилання на пов\'язаний запис' });
    }
    if (err.message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Запис не знайдено' });
    }
  }

  res.status(500).json({ error: 'Внутрішня помилка сервера. Спробуйте пізніше.' });
}


