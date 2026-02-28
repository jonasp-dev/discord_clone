import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../utils/http-exception';
import { logger } from '../config/logger';
import { errorResponse } from '../types/api';

export const errorMiddleware = (
  error: Error | HttpException,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof HttpException) {
    logger.warn(
      {
        statusCode: error.statusCode,
        message: error.message,
        path: req.path,
        method: req.method,
      },
      'HTTP Exception'
    );

    res.status(error.statusCode).json(errorResponse(error.message, error.errors));
  } else {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
      },
      'Unhandled Error'
    );

    res.status(500).json(errorResponse('Internal Server Error'));
  }
};
