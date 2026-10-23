import { prisma } from '../config/db';

/**
 * Transparent Campus Health Score Formula:
 * -----------------------------------------
 * Formula:
 *   Base Score = 100
 *   - Active Complaints Penalty: -2 per open complaint (Max penalty: 30)
 *   - Critical Unresolved Penalty: -6 per open critical complaint (Max penalty: 25)
 *   - Overdue Unresolved Penalty (> 72h old): -4 per overdue complaint (Max penalty: 20)
 *   + Resolution Rate Bonus: (Resolved / Total Lifetime) * 15 (if lifetime > 0)
 *   Result clamped to [10, 100].
 *
 * NOTE: Application-generated operational metric only; not an official safety certification.
 */
export async function calculateCampusHealthScore() {
  const total = await prisma.complaint.count();
  
  const resolved = await prisma.complaint.count({
    where: { status: 'Resolved' },
  });

  const active = await prisma.complaint.count({
    where: { status: { notIn: ['Resolved', 'Rejected'] } },
  });

  const criticalOpen = await prisma.complaint.count({
    where: {
      priority: 'Critical',
      status: { notIn: ['Resolved', 'Rejected'] },
    },
  });

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const overdue = await prisma.complaint.count({
    where: {
      createdAt: { lt: seventyTwoHoursAgo },
      status: { notIn: ['Resolved', 'Rejected'] },
    },
  });

  let score = 100;
  const activePenalty = Math.min(30, active * 2);
  const criticalPenalty = Math.min(25, criticalOpen * 6);
  const overduePenalty = Math.min(20, overdue * 4);
  
  const resolutionRatio = total > 0 ? (resolved / total) : 1;
  const resolutionBonus = Math.round(resolutionRatio * 15);

  score = score - activePenalty - criticalPenalty - overduePenalty + resolutionBonus;
  score = Math.max(10, Math.min(100, Math.round(score)));

  let grade = 'A+ (Optimal)';
  let color = 'emerald';
  if (score < 60) {
    grade = 'Needs Urgent Attention';
    color = 'rose';
  } else if (score < 75) {
    grade = 'Moderate Condition';
    color = 'amber';
  } else if (score < 90) {
    grade = 'Good Operational Health';
    color = 'blue';
  }

  return {
    score,
    grade,
    color,
    metrics: {
      totalComplaints: total,
      activeComplaints: active,
      resolvedComplaints: resolved,
      criticalUnresolved: criticalOpen,
      overdueUnresolved: overdue,
      resolutionRatePercentage: total > 0 ? Math.round((resolved / total) * 100) : 100,
    },
    formulaDescription:
      'Score is calculated from baseline (100) subtracting penalties for active, critical, and overdue complaints, plus a resolution efficiency bonus. This is an application-generated indicator and not an official regulatory safety certification.',
  };
}
