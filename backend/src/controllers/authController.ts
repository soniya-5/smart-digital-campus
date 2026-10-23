import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import {
  hashPassword,
  comparePassword,
  signToken,
  getAuthCookieOptions,
  AUTH_COOKIE_NAME,
} from '../utils/auth';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { logAudit } from '../utils/auditLogger';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, studentId, phone, roomNo } = req.body;

    if (!email || !password || !name) {
      return next(new AppError('Email, password, and name are required.', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters.', 400));
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError('Invalid email format.', 400));
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    if (studentId) {
      const existingStudentId = await prisma.user.findUnique({
        where: { studentId: studentId.trim() },
      });
      if (existingStudentId) {
        return next(new AppError('This Student ID is already registered.', 409));
      }
    }

    const passwordHash = await hashPassword(password);

    // Public registration MUST ALWAYS be STUDENT (enforced on server)
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        role: 'STUDENT',
        studentId: studentId ? studentId.trim() : null,
        phone: phone ? phone.trim() : null,
        roomNo: roomNo ? roomNo.trim() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        studentId: true,
        phone: true,
        roomNo: true,
        points: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: newUser.id, role: newUser.role });
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    await logAudit({
      userId: newUser.id,
      action: 'USER_REGISTER',
      resource: 'User',
      resourceId: newUser.id,
      details: `Student registered: ${newUser.email}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: newUser, token }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Email and password are required.', 400));
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    const { passwordHash, ...safeUser } = user;

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: user.id,
      details: `User logged in with role ${user.role}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { user: safeUser, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
  return sendSuccess(res, null, 'Logged out successfully');
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        studentId: true,
        phone: true,
        roomNo: true,
        points: true,
        department: {
          select: { id: true, name: true, code: true },
        },
        createdAt: true,
      },
    });

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    return sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    const { name, phone, roomNo } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(roomNo !== undefined ? { roomNo: roomNo?.trim() || null } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        studentId: true,
        phone: true,
        roomNo: true,
        points: true,
      },
    });

    return sendSuccess(res, updatedUser, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Current and new password are required.', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters long.', 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect.', 400));
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await logAudit({
      userId: user.id,
      action: 'PASSWORD_CHANGE',
      resource: 'User',
      resourceId: user.id,
      details: 'User successfully updated password',
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
}
