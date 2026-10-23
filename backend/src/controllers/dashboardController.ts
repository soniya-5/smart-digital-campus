import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { calculateCampusHealthScore } from '../utils/healthScore';

export async function getStudentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const studentId = req.user.id;

    const [
      totalComplaints,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      recentComplaints,
      recentNotifications,
      activeSOSAlerts,
      upcomingExams,
    ] = await Promise.all([
      prisma.complaint.count({ where: { reporterId: studentId } }),
      prisma.complaint.count({
        where: { reporterId: studentId, status: { in: ['Submitted', 'Under Review', 'Assigned', 'Reopened'] } },
      }),
      prisma.complaint.count({
        where: { reporterId: studentId, status: 'In Progress' },
      }),
      prisma.complaint.count({
        where: { reporterId: studentId, status: 'Resolved' },
      }),
      prisma.complaint.findMany({
        where: { reporterId: studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          assignedDepartment: { select: { name: true } },
        },
      }),
      prisma.notification.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.sOSAlert.count({
        where: { reporterId: studentId, status: 'ACTIVE' },
      }),
      prisma.examinationRecord.findMany({
        where: { examDate: { gte: new Date() } },
        orderBy: { examDate: 'asc' },
        take: 3,
      }),
    ]);

    const healthScore = await calculateCampusHealthScore();

    return sendSuccess(res, {
      stats: {
        totalComplaints,
        openComplaints,
        inProgressComplaints,
        resolvedComplaints,
        points: req.user.points,
        activeSOSAlerts,
      },
      recentComplaints,
      recentNotifications,
      upcomingExams,
      healthScore,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStaffDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const staffId = req.user.id;
    const departmentId = req.user.departmentId;

    const whereScope: any = {
      OR: [{ assignedStaffId: staffId }],
    };
    if (departmentId) {
      whereScope.OR.push({ assignedDepartmentId: departmentId });
    }

    const [
      assignedCount,
      inProgressCount,
      resolvedCount,
      criticalCount,
      assignedComplaints,
      department,
    ] = await Promise.all([
      prisma.complaint.count({ where: { ...whereScope, status: 'Assigned' } }),
      prisma.complaint.count({ where: { ...whereScope, status: 'In Progress' } }),
      prisma.complaint.count({ where: { ...whereScope, status: 'Resolved' } }),
      prisma.complaint.count({
        where: {
          ...whereScope,
          priority: 'Critical',
          status: { notIn: ['Resolved', 'Rejected'] },
        },
      }),
      prisma.complaint.findMany({
        where: whereScope,
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          reporter: { select: { name: true, studentId: true, phone: true } },
          assignedDepartment: { select: { name: true } },
        },
      }),
      departmentId
        ? prisma.department.findUnique({ where: { id: departmentId } })
        : null,
    ]);

    return sendSuccess(res, {
      stats: {
        assignedCount,
        inProgressCount,
        resolvedCount,
        criticalCount,
        departmentName: department?.name || 'General Staff',
      },
      assignedComplaints,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrative authorization required.', 403));
    }

    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      criticalComplaints,
      overdueComplaints,
      totalUsers,
      totalStudents,
      totalStaff,
      activeSOSAlerts,
      recentComplaints,
      allComplaintsForMetrics,
      departments,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({
        where: { status: { in: ['Submitted', 'Under Review', 'Assigned', 'Reopened'] } },
      }),
      prisma.complaint.count({ where: { status: 'In Progress' } }),
      prisma.complaint.count({ where: { status: 'Resolved' } }),
      prisma.complaint.count({
        where: { priority: 'Critical', status: { notIn: ['Resolved', 'Rejected'] } },
      }),
      prisma.complaint.count({
        where: {
          createdAt: { lt: seventyTwoHoursAgo },
          status: { notIn: ['Resolved', 'Rejected'] },
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'STAFF' } }),
      prisma.sOSAlert.count({ where: { status: 'ACTIVE' } }),
      prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          reporter: { select: { name: true, email: true } },
          assignedDepartment: { select: { name: true } },
        },
      }),
      prisma.complaint.findMany({
        select: {
          category: true,
          location: true,
          status: true,
          createdAt: true,
          resolvedAt: true,
          assignedDepartmentId: true,
        },
      }),
      prisma.department.findMany({
        include: {
          _count: { select: { complaints: true, users: true } },
        },
      }),
    ]);

    // Calculate Category Distribution
    const categoryDistribution: Record<string, number> = {};
    const locationDistribution: Record<string, number> = {};
    let totalResolutionTimeHours = 0;
    let resolvedWithTimeCount = 0;

    for (const c of allComplaintsForMetrics) {
      categoryDistribution[c.category] = (categoryDistribution[c.category] || 0) + 1;
      if (c.location) {
        locationDistribution[c.location] = (locationDistribution[c.location] || 0) + 1;
      }

      if (c.status === 'Resolved' && c.resolvedAt) {
        const diffHours =
          (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()) /
          (1000 * 60 * 60);
        if (diffHours >= 0) {
          totalResolutionTimeHours += diffHours;
          resolvedWithTimeCount++;
        }
      }
    }

    const averageResolutionTimeHours =
      resolvedWithTimeCount > 0
        ? Math.round((totalResolutionTimeHours / resolvedWithTimeCount) * 10) / 10
        : 0;

    // Format category distribution as array for easy charting
    const categoryChartData = Object.entries(categoryDistribution).map(([name, count]) => ({
      name,
      count,
    }));

    // Format location distribution as array
    const locationChartData = Object.entries(locationDistribution)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Department Performance
    const departmentPerformance = departments.map((d: any) => {
      const deptComplaints = allComplaintsForMetrics.filter(
        (c: any) => c.assignedDepartmentId === d.id
      );
      const deptResolved = deptComplaints.filter((c: any) => c.status === 'Resolved').length;
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        staffCount: d._count.users,
        totalComplaints: deptComplaints.length,
        resolvedComplaints: deptResolved,
        resolutionRate:
          deptComplaints.length > 0
            ? Math.round((deptResolved / deptComplaints.length) * 100)
            : 100,
      };
    });

    const healthScore = await calculateCampusHealthScore();

    return sendSuccess(res, {
      stats: {
        totalComplaints,
        pendingComplaints,
        inProgressComplaints,
        resolvedComplaints,
        criticalComplaints,
        overdueComplaints,
        totalUsers,
        totalStudents,
        totalStaff,
        activeSOSAlerts,
        averageResolutionTimeHours,
      },
      categoryChartData,
      locationChartData,
      departmentPerformance,
      recentComplaints,
      healthScore,
    });
  } catch (err) {
    next(err);
  }
}
