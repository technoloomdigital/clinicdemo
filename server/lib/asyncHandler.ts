import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async Express route/middleware so a rejected promise (any thrown error,
 * including ones we didn't anticipate — a bad env value, a slow scrypt call, etc.)
 * is passed to next(err) and handled by our JSON error middleware, instead of
 * becoming an unhandled rejection that can crash the whole process.
 *
 * Express 4 (used here) does NOT do this automatically for async handlers — that
 * gap is exactly what let one failing request take the entire server down.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
