import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { logAudit } from '../utils/auditLogger';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, departmentId, search } = req.query;

    const where: any = {};
    if (role && role !== 'all') {
      where.role = role;
    }
    if (departmentId && departmentId !== 'all') {
      where.departmentId = departmentId;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { studentId: { contains: q } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        studentId: true,
        phone: true,
        roomNo: true,
        points: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
        createdAt: true,
      },
    });

    return sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role, departmentId } = req.body;

    if (!role || !['STUDENT', 'STAFF', 'ADMIN'].includes(role)) {
      return next(new AppError('Invalid role specified.', 400));
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return next(new AppError('User not found.', 404));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role,
        departmentId: departmentId !== undefined ? departmentId : targetUser.departmentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE_USER_ROLE',
      resource: 'User',
      resourceId: id,
      details: `Changed role of ${targetUser.email} to ${role}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'User role updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getDepartments(req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, complaints: true },
        },
      },
    });

    return sendSuccess(res, departments);
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code, contactEmail, contactPhone, description } = req.body;

    if (!name || !code) {
      return next(new AppError('Department name and code are required.', 400));
    }

    const existing = await prisma.department.findFirst({
      where: {
        OR: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
      },
    });

    if (existing) {
      return next(new AppError('Department with this name or code already exists.', 409));
    }

    const dept = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactEmail: contactEmail ? contactEmail.trim() : null,
        contactPhone: contactPhone ? contactPhone.trim() : null,
        description: description ? description.trim() : null,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_DEPARTMENT',
      resource: 'Department',
      resourceId: dept.id,
      details: `Created department ${dept.name} (${dept.code})`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, dept, 'Department created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function createStaffAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, departmentId, phone } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Full name, email, and password are required.', 400));
    }

    if (password.length < 8) {
      return next(new AppError('Staff password must be at least 8 characters long.', 400));
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return next(new AppError('A user with this email address already exists.', 409));
    }

    if (departmentId) {
      const deptExists = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!deptExists) {
        return next(new AppError('Selected department not found.', 400));
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newStaff = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'STAFF',
        departmentId: departmentId || null,
        phone: phone ? phone.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        phone: true,
        createdAt: true,
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_STAFF_ACCOUNT',
      resource: 'User',
      resourceId: newStaff.id,
      details: `Created staff account for ${newStaff.email} (${newStaff.name})`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, newStaff, 'Staff account created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    return sendSuccess(res, logs);
  } catch (err) {
    next(err);
  }
}
