import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendSuccess } from '../utils/response';
import { calculateCampusHealthScore } from '../utils/healthScore';
import { CAMPUS_LOCATIONS } from '../config/constants';

export async function getHealthScore(req: Request, res: Response, next: NextFunction) {
  try {
    const health = await calculateCampusHealthScore();
    return sendSuccess(res, health);
  } catch (err) {
    next(err);
  }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const topUsers = await prisma.user.findMany({
      where: {
        points: { gt: 0 },
        role: 'STUDENT',
      },
      orderBy: { points: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        studentId: true,
        points: true,
      },
    });

    // Privacy-conscious display: e.g. "Alex D. (STU***12)"
    const sanitizedLeaderboard = topUsers.map((user, index) => {
      const parts = user.name.trim().split(' ');
      const displayName =
        parts.length > 1
          ? `${parts[0]} ${parts[parts.length - 1][0]}.`
          : parts[0];

      const maskedStudentId = user.studentId
        ? `${user.studentId.slice(0, 3)}***${user.studentId.slice(-2)}`
        : null;

      return {
        rank: index + 1,
        id: user.id,
        displayName,
        maskedStudentId,
        points: user.points,
      };
    });

    return sendSuccess(res, sanitizedLeaderboard);
  } catch (err) {
    next(err);
  }
}

export async function getHotspots(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, status } = req.query;

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      select: {
        id: true,
        location: true,
        status: true,
        priority: true,
        category: true,
      },
    });

    // Aggregate counts by location
    const countsByLocation: Record<
      string,
      { total: number; active: number; critical: number; categories: Record<string, number> }
    > = {};

    for (const c of complaints) {
      if (!c.location) continue;
      if (!countsByLocation[c.location]) {
        countsByLocation[c.location] = {
          total: 0,
          active: 0,
          critical: 0,
          categories: {},
        };
      }
      countsByLocation[c.location].total++;
      if (c.status !== 'Resolved' && c.status !== 'Rejected') {
        countsByLocation[c.location].active++;
      }
      if (c.priority === 'Critical' && c.status !== 'Resolved') {
        countsByLocation[c.location].critical++;
      }
      countsByLocation[c.location].categories[c.category] =
        (countsByLocation[c.location].categories[c.category] || 0) + 1;
    }

    // Merge with predefined CAMPUS_LOCATIONS
    const hotspots = CAMPUS_LOCATIONS.map((loc) => {
      // Find matching complaint aggregation (either by name or id)
      const data =
        countsByLocation[loc.name] ||
        countsByLocation[loc.id] || {
          total: 0,
          active: 0,
          critical: 0,
          categories: {},
        };

      // Severity level for indicator color
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (data.critical > 0 || data.active >= 8) {
        severity = 'critical';
      } else if (data.active >= 4) {
        severity = 'high';
      } else if (data.active >= 1) {
        severity = 'medium';
      }

      return {
        ...loc,
        totalComplaints: data.total,
        activeComplaints: data.active,
        criticalComplaints: data.critical,
        categoryBreakdown: data.categories,
        severity,
      };
    });

    return sendSuccess(res, hotspots);
  } catch (err) {
    next(err);
  }
}

export async function getMaintenanceTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const complaints = await prisma.complaint.findMany({
      select: {
        category: true,
        location: true,
        status: true,
        priority: true,
      },
    });

    const categoryCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    complaints.forEach((c) => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      if (c.location) {
        locationCounts[c.location] = (locationCounts[c.location] || 0) + 1;
      }
    });

    const topCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topLocations = Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return sendSuccess(res, {
      topCategories,
      topLocations,
      totalIssuesAnalyzed: complaints.length,
    });
  } catch (err) {
    next(err);
  }
}
