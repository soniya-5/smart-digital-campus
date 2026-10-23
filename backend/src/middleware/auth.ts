import { Request, Response, NextFunction } from 'express';
import { verifyToken, AUTH_COOKIE_NAME } from '../utils/auth';
import { prisma } from '../config/db';
import { AppError } from './errorHandler';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId?: string | null;
  studentId?: string | null;
  points: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new AppError('Session expired or invalid. Please log in again.', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        studentId: true,
        points: true,
      },
    });

    if (!user) {
      return next(new AppError('User account not found.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: requires one of [${roles.join(', ')}] roles.`,
          403
        )
      );
    }
    next();
  };
};
