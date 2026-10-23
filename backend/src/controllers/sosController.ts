import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { notifyAllAdmins } from '../services/notificationService';
import { logAudit } from '../utils/auditLogger';

export async function submitSOSAlert(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { alertType, location, details } = req.body;

    if (!alertType || !location) {
      return next(new AppError('Alert type and location are required.', 400));
    }

    const alert = await prisma.sOSAlert.create({
      data: {
        reporterId: req.user.id,
        alertType: alertType.trim(),
        location: location.trim(),
        details: details ? details.trim() : null,
        status: 'ACTIVE',
      },
      include: {
        reporter: {
          select: { id: true, name: true, phone: true, studentId: true, email: true },
        },
      },
    });

    // Notify all campus administrators immediately
    await notifyAllAdmins({
      title: `EMERGENCY SOS: ${alertType} in ${location}`,
      message: `Urgent SOS submitted by ${alert.reporter.name} (${alert.reporter.phone || 'No phone'}). Location: ${location}.`,
      type: 'SOS',
      link: '/sos',
    });

    await logAudit({
      userId: req.user.id,
      action: 'SUBMIT_SOS_ALERT',
      resource: 'SOSAlert',
      resourceId: alert.id,
      details: `SOS alert triggered: ${alertType} at ${location}`,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        alert,
        disclaimer:
          'IMPORTANT NOTICE: This is an internal campus operational notification tool. It does NOT automatically dial 911/112 or local emergency services. If you or someone else is in immediate life-threatening danger, contact local emergency services directly immediately.',
      },
      'SOS alert dispatched to campus security and administrators',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function getSOSAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const where: any = {};
    // Students only see their own alerts; Admin & Staff see all active/historical
    if (req.user.role === 'STUDENT') {
      where.reporterId = req.user.id;
    }

    const alerts = await prisma.sOSAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, name: true, phone: true, studentId: true, email: true },
        },
        acknowledgedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
}

export async function acknowledgeSOSAlert(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrator authorization required.', 403));
    }

    const { id } = req.params;

    const alert = await prisma.sOSAlert.findUnique({ where: { id } });
    if (!alert) {
      return next(new AppError('Alert not found.', 404));
    }

    const updated = await prisma.sOSAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedById: req.user.id,
        acknowledgedAt: new Date(),
      },
      include: {
        acknowledgedBy: { select: { name: true } },
      },
    });

    await logAudit({
      userId: req.user.id,
      action: 'ACKNOWLEDGE_SOS_ALERT',
      resource: 'SOSAlert',
      resourceId: id,
      details: 'Administrator acknowledged emergency alert',
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Alert acknowledged');
  } catch (err) {
    next(err);
  }
}

export async function resolveSOSAlert(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrator authorization required.', 403));
    }

    const { id } = req.params;

    const alert = await prisma.sOSAlert.findUnique({ where: { id } });
    if (!alert) {
      return next(new AppError('Alert not found.', 404));
    }

    const updated = await prisma.sOSAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    await logAudit({
      userId: req.user.id,
      action: 'RESOLVE_SOS_ALERT',
      resource: 'SOSAlert',
      resourceId: id,
      details: 'Administrator marked SOS alert as resolved',
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Alert resolved');
  } catch (err) {
    next(err);
  }
}
