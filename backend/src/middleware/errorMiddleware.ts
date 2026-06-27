import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
}

/**
 * Global Express Exception Handler Middleware.
 * Catches all unhandled controller rejections and formats standard secure JSON payloads.
 */
export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the exception details with metadata
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Unhandled Exception: [${req.method}] ${req.url}`);
  console.error(err.stack || err.message || err);

  // If response headers have already been sent, defer to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: isProduction ? 'An unexpected database or server error occurred.' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
