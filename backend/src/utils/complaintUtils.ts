import { prisma } from '../config/db';

/**
 * Generates an incremental unique complaint ID formatted as CMP-YYYY-XXXX
 */
export async function generateComplaintId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CMP-${currentYear}-`;

  // Find the latest complaint created in this year
  const latestComplaint = await prisma.complaint.findFirst({
    where: {
      id: {
        startsWith: prefix,
      },
    },
    orderBy: {
      id: 'desc',
    },
    select: {
      id: true,
    },
  });

  let nextSequence = 1;
  if (latestComplaint) {
    const parts = latestComplaint.id.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSequence}`;
}

/**
 * Calculates simple token overlap similarity between two strings
 */
function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(
    a
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const wordsB = new Set(
    b
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let common = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) common++;
  }

  const intersection = common;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Checks for potential duplicate active complaints in the same location / category
 */
export async function checkDuplicateComplaints(params: {
  category: string;
  location?: string | null;
  roomNumber?: string;
  title: string;
  description: string;
}) {
  // Query open complaints with matching category and optional location
  const whereClause: any = {
    category: params.category,
    status: {
      notIn: ['Resolved', 'Rejected'],
    },
  };

  if (params.location) {
    whereClause.location = params.location;
  }

  const activeComplaints = await prisma.complaint.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      description: true,
      roomNumber: true,
      status: true,
      createdAt: true,
    },
    take: 10,
  });

  const matches = [];

  for (const item of activeComplaints) {
    // Check room matching if room provided
    const roomMatches =
      !params.roomNumber ||
      !item.roomNumber ||
      params.roomNumber.toLowerCase().trim() === item.roomNumber.toLowerCase().trim();

    const titleSim = textSimilarity(params.title, item.title);
    const descSim = textSimilarity(params.description, item.description);
    const overallScore = titleSim * 0.6 + descSim * 0.4;

    if (overallScore > 0.35 || (roomMatches && titleSim > 0.4)) {
      matches.push({
        id: item.id,
        title: item.title,
        roomNumber: item.roomNumber,
        status: item.status,
        createdAt: item.createdAt,
        similarityScore: Math.round(overallScore * 100),
      });
    }
  }

  return matches;
}
