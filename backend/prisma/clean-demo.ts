import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDemoData() {
  console.log('Cleaning demo seed records while preserving real user accounts...');

  const demoEmails = [
    'staff.electric@campus.edu',
    'staff.it@campus.edu',
    'student.alice@campus.edu',
    'student.bob@campus.edu',
    'admin@campus.edu',
    'admin.sys@campus.edu',
  ];

  // 1. Delete comments, history, feedbacks, verifications on demo complaints
  const demoComplaints = await prisma.complaint.findMany({
    where: {
      OR: [
        { id: { in: ['CMP-2026-0001', 'CMP-2026-0002', 'CMP-2026-0003', 'CMP-2026-0004', 'CMP-2026-0005'] } },
        { reporter: { email: { in: demoEmails } } },
      ],
    },
    select: { id: true },
  });
  const demoComplaintIds = demoComplaints.map((c) => c.id);

  if (demoComplaintIds.length > 0) {
    await prisma.complaintComment.deleteMany({ where: { complaintId: { in: demoComplaintIds } } });
    await prisma.complaintStatusHistory.deleteMany({ where: { complaintId: { in: demoComplaintIds } } });
    await prisma.complaintFeedback.deleteMany({ where: { complaintId: { in: demoComplaintIds } } });
    await prisma.communityVerification.deleteMany({ where: { complaintId: { in: demoComplaintIds } } });
    const deletedComplaints = await prisma.complaint.deleteMany({ where: { id: { in: demoComplaintIds } } });
    console.log(`Deleted ${deletedComplaints.count} demo complaints.`);
  }

  // 2. Clean demo announcements
  const deletedAnnouncements = await prisma.announcement.deleteMany({
    where: { author: { email: { in: demoEmails } } },
  });
  console.log(`Deleted ${deletedAnnouncements.count} demo announcements.`);

  // 3. Clean demo study groups & members
  const demoStudyGroups = await prisma.studyGroup.findMany({
    where: { creator: { email: { in: demoEmails } } },
    select: { id: true },
  });
  const demoGroupIds = demoStudyGroups.map((g) => g.id);
  if (demoGroupIds.length > 0) {
    await prisma.studyGroupMember.deleteMany({ where: { groupId: { in: demoGroupIds } } });
    await prisma.studyGroup.deleteMany({ where: { id: { in: demoGroupIds } } });
    console.log(`Deleted ${demoGroupIds.length} demo study groups.`);
  }

  // 4. Clean demo calendar events & exam records
  const deletedRegistrations = await prisma.eventRegistration.deleteMany({
    where: { user: { email: { in: demoEmails } } },
  });
  const deletedEvents = await prisma.calendarEvent.deleteMany({
    where: { isOfficial: true },
  });
  console.log(`Deleted ${deletedEvents.count} demo calendar events.`);

  const deletedExams = await prisma.examinationRecord.deleteMany({});
  console.log(`Deleted ${deletedExams.count} demo exam records.`);

  // 5. Clean demo canteen items
  const deletedCanteen = await prisma.canteenMenuItem.deleteMany({});
  console.log(`Deleted ${deletedCanteen.count} demo canteen items.`);

  // 6. Clean demo attendance records (not Soniya's)
  const deletedAttendance = await prisma.attendanceRecord.deleteMany({
    where: { student: { email: { in: demoEmails } } },
  });
  console.log(`Deleted ${deletedAttendance.count} demo attendance records.`);

  // 7. Clean demo improvement points
  await prisma.improvementPoint.deleteMany({
    where: { user: { email: { in: demoEmails } } },
  });

  // 8. Delete demo users
  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { in: demoEmails } },
  });
  console.log(`Deleted ${deletedUsers.count} demo accounts.`);

  // Verify remaining real accounts
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  console.log('Remaining real accounts in DB:');
  console.table(remainingUsers);

  await prisma.$disconnect();
}

cleanDemoData().catch((err) => {
  console.error('[ERROR] Failed to clean demo data:', err);
  process.exit(1);
});
