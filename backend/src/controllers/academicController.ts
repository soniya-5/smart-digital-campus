import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { notifyUsers } from '../services/notificationService';
import { logAudit } from '../utils/auditLogger';

// ======================== TIMETABLE ========================

// Helper to convert "HH:mm" to minutes from midnight
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map((v) => parseInt(v, 10));
  return h * 60 + (m || 0);
}

export async function getTimetable(req: Request, res: Response, next: NextFunction) {
  try {
    const { batch } = req.query;

    const where: any = {
      AND: [
        {
          OR: [{ userId: null }, { userId: req.user?.id || '' }],
        },
      ],
    };

    if (batch && batch !== 'ALL') {
      where.AND.push({
        OR: [{ batch: 'ALL' }, { batch: null }, { batch: String(batch).toUpperCase() }],
      });
    }

    const entries = await prisma.timetableEntry.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return sendSuccess(res, {
      metadata: {
        className: 'S.E. (III) (Computer Engg.)',
        semester: 'SEM III',
        classroom: '005',
        gfm: 'Prof. M.A. Patil (MAP)',
        wef: '06/07/2026',
      },
      entries,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTimetableEntry(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { subject, code, dayOfWeek, startTime, endTime, location, facultyName, batch, type } = req.body;

    if (!subject || !dayOfWeek || !startTime || !endTime || !location) {
      return next(new AppError('Subject, day of week, start time, end time, and location are required.', 400));
    }

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    if (newStart >= newEnd) {
      return next(new AppError('End time must be after start time.', 400));
    }

    // Overlap validation for personal custom entries
    const existing = await prisma.timetableEntry.findMany({
      where: {
        userId: req.user.id,
        dayOfWeek,
      },
    });

    for (const item of existing) {
      const existStart = timeToMinutes(item.startTime);
      const existEnd = timeToMinutes(item.endTime);

      const hasOverlap = Math.max(newStart, existStart) < Math.min(newEnd, existEnd);
      if (hasOverlap) {
        return next(
          new AppError(
            `Time conflict detected: clashes with existing class "${item.subject}" (${item.startTime} - ${item.endTime}) in ${item.location}.`,
            400
          )
        );
      }
    }

    const entry = await prisma.timetableEntry.create({
      data: {
        userId: req.user.id,
        subject: subject.trim(),
        code: code ? code.trim() : null,
        dayOfWeek,
        startTime,
        endTime,
        location: location.trim(),
        facultyName: facultyName ? facultyName.trim() : null,
        batch: batch || 'ALL',
        type: type || 'LECTURE',
      },
    });

    return sendSuccess(res, entry, 'Timetable entry added successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteTimetableEntry(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const entry = await prisma.timetableEntry.findUnique({ where: { id } });

    if (!entry || entry.userId !== req.user.id) {
      return next(new AppError('Timetable entry not found or access denied.', 404));
    }

    await prisma.timetableEntry.delete({ where: { id } });
    return sendSuccess(res, null, 'Timetable entry deleted');
  } catch (err) {
    next(err);
  }
}

// ======================== CALENDAR & EVENTS ========================

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { eventType } = req.query;
    const where: any = {};
    if (eventType && eventType !== 'all') {
      where.eventType = eventType;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        registrations: {
          select: { userId: true },
        },
      },
    });

    // Attach registered status if logged in
    const userId = req.user?.id;
    const mapped = events.map((ev) => ({
      ...ev,
      registeredCount: ev.registrations.length,
      isUserRegistered: userId ? ev.registrations.some((r) => r.userId === userId) : false,
      registrations: undefined,
    }));

    return sendSuccess(res, mapped);
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
      return next(new AppError('Administrative or staff authorization required.', 403));
    }

    const { title, description, eventType, startDate, endDate, location, organizer, capacity } = req.body;

    if (!title || !description || !eventType || !startDate || !endDate) {
      return next(new AppError('Title, description, event type, start date, and end date are required.', 400));
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        eventType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location: location ? location.trim() : null,
        organizer: organizer ? organizer.trim() : null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        isOfficial: true,
      },
    });

    return sendSuccess(res, event, 'Event created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function registerForEvent(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: { registrations: true },
    });

    if (!event) {
      return next(new AppError('Event not found.', 404));
    }

    // Check duplicate
    const isRegistered = event.registrations.some((r) => r.userId === req.user!.id);
    if (isRegistered) {
      return next(new AppError('You are already registered for this campus event.', 409));
    }

    // Check capacity
    if (event.capacity && event.registrations.length >= event.capacity) {
      return next(new AppError('Event has reached maximum attendance capacity.', 400));
    }

    const reg = await prisma.eventRegistration.create({
      data: {
        eventId: id,
        userId: req.user.id,
      },
    });

    return sendSuccess(res, reg, 'Successfully registered for event', 201);
  } catch (err) {
    next(err);
  }
}

// ======================== ANNOUNCEMENTS ========================

export async function getAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, includeArchived } = req.query;

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (!includeArchived || includeArchived === 'false') {
      where.isArchived = false;
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { name: true, role: true } },
      },
    });

    return sendSuccess(res, announcements);
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrator authorization required.', 403));
    }

    const { title, content, category, isPinned } = req.body;

    if (!title || !content) {
      return next(new AppError('Title and content are required.', 400));
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category || 'General',
        isPinned: Boolean(isPinned),
        authorId: req.user.id,
      },
    });

    // Notify all active students and staff
    const users = await prisma.user.findMany({ select: { id: true } });
    await notifyUsers(
      users.map((u) => u.id),
      {
        title: `Official Notice: ${title}`,
        message: content.substring(0, 100),
        type: 'ANNOUNCEMENT',
        link: '/announcements',
      }
    );

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_ANNOUNCEMENT',
      resource: 'Announcement',
      resourceId: announcement.id,
      details: `Published announcement "${announcement.title}"`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, announcement, 'Announcement published successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrator authorization required.', 403));
    }

    const { id } = req.params;
    const { title, content, category, isPinned, isArchived } = req.body;

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(content ? { content: content.trim() } : {}),
        ...(category ? { category } : {}),
        ...(isPinned !== undefined ? { isPinned: Boolean(isPinned) } : {}),
        ...(isArchived !== undefined ? { isArchived: Boolean(isArchived) } : {}),
      },
    });

    return sendSuccess(res, updated, 'Announcement updated successfully');
  } catch (err) {
    next(err);
  }
}

// ======================== EXAM RECORDS ========================

export async function getExams(req: Request, res: Response, next: NextFunction) {
  try {
    const exams = await prisma.examinationRecord.findMany({
      orderBy: { examDate: 'asc' },
    });

    // Calculate days remaining from current time
    const now = new Date();
    const formatted = exams.map((exam) => {
      const examDateTime = new Date(exam.examDate);
      const diffMs = examDateTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        ...exam,
        daysRemaining: diffDays,
        isPast: diffDays < 0,
      };
    });

    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
}

export async function createExam(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrator authorization required.', 403));
    }

    const { courseCode, courseName, examDate, startTime, endTime, venue, department, seatNumber, notes } = req.body;

    if (!courseCode || !courseName || !examDate || !startTime || !endTime || !venue || !department) {
      return next(new AppError('All required exam schedule fields must be provided.', 400));
    }

    const exam = await prisma.examinationRecord.create({
      data: {
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        examDate: new Date(examDate),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        venue: venue.trim(),
        department: department.trim(),
        seatNumber: seatNumber ? seatNumber.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    return sendSuccess(res, exam, 'Exam schedule created successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ======================== ATTENDANCE TRACKER ========================

export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: req.user.id },
      orderBy: { subject: 'asc' },
    });

    // Calculate percentage and requirement status (e.g., 75% target)
    const formatted = records.map((r) => {
      const percentage =
        r.totalClasses > 0 ? Math.round((r.attendedClasses / r.totalClasses) * 100) : 100;
      return {
        ...r,
        percentage,
        isEligible: percentage >= 75,
      };
    });

    return sendSuccess(res, {
      records: formatted,
      disclaimer:
        'NOTICE: This attendance tracker is self-recorded by the student for personal academic planning and does NOT constitute official institutional attendance records.',
    });
  } catch (err) {
    next(err);
  }
}

export async function recordAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { subject, totalClasses, attendedClasses, notes } = req.body;

    if (!subject || totalClasses === undefined || attendedClasses === undefined) {
      return next(new AppError('Subject, total classes, and attended classes are required.', 400));
    }

    const total = parseInt(totalClasses, 10);
    const attended = parseInt(attendedClasses, 10);

    if (total < 0 || attended < 0 || attended > total) {
      return next(new AppError('Attended classes must be between 0 and total classes.', 400));
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        // Find existing record by studentId and subject
        id: req.body.id || 'non-existent-id',
      },
      create: {
        studentId: req.user.id,
        subject: subject.trim(),
        totalClasses: total,
        attendedClasses: attended,
        notes: notes ? notes.trim() : null,
      },
      update: {
        subject: subject.trim(),
        totalClasses: total,
        attendedClasses: attended,
        notes: notes ? notes.trim() : null,
        lastUpdated: new Date(),
      },
    });

    return sendSuccess(res, record, 'Attendance record updated successfully');
  } catch (err) {
    next(err);
  }
}

// ======================== TIMETABLE-INTEGRATED ATTENDANCE SESSIONS ========================

function getDayOfWeekFromDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }
  return 'Monday';
}

export async function getAttendanceSessions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = (req.query.date as string) || todayStr;
    const dayOfWeek = (req.query.day as string) || getDayOfWeekFromDate(targetDate);
    const batch = (req.query.batch as string) || 'ALL';

    const where: any = {
      AND: [
        {
          OR: [{ userId: null }, { userId: req.user.id }],
        },
        {
          dayOfWeek,
        },
      ],
    };

    if (batch && batch !== 'ALL') {
      where.AND.push({
        OR: [{ batch: 'ALL' }, { batch: null }, { batch: String(batch).toUpperCase() }],
      });
    }

    // Get timetable entries for that day of week matching batch
    const timetableEntries = await prisma.timetableEntry.findMany({
      where,
      orderBy: [{ startTime: 'asc' }, { subject: 'asc' }],
    });

    // Get marked sessions on targetDate for this student
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        studentId: req.user.id,
        date: targetDate,
      },
    });

    const sessionMap = new Map(sessions.map((s) => [s.timetableEntryId, s]));

    const scheduledSessions = timetableEntries.map((entry) => {
      const session = sessionMap.get(entry.id);
      return {
        timetableEntryId: entry.id,
        subject: entry.subject,
        code: entry.code || entry.subject,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        location: entry.location,
        facultyName: entry.facultyName,
        batch: entry.batch,
        type: entry.type,
        date: targetDate,
        status: session ? session.status : 'UNMARKED', // ATTENDED | NOT_ATTENDED | UNMARKED
        sessionId: session ? session.id : null,
        markedAt: session ? session.markedAt : null,
      };
    });

    return sendSuccess(res, {
      date: targetDate,
      dayOfWeek,
      batch,
      sessions: scheduledSessions,
      totalCount: scheduledSessions.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAttendanceSession(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { timetableEntryId, date, status } = req.body;

    if (!timetableEntryId || !date || !status) {
      return next(new AppError('Timetable class ID, date, and status are required.', 400));
    }

    if (!['ATTENDED', 'NOT_ATTENDED'].includes(status)) {
      return next(new AppError('Status must be ATTENDED or NOT_ATTENDED.', 400));
    }

    const entry = await prisma.timetableEntry.findUnique({
      where: { id: timetableEntryId },
    });

    if (!entry || (entry.userId && entry.userId !== req.user.id)) {
      return next(new AppError('Timetable class not found or unauthorized.', 404));
    }

    const session = await prisma.attendanceSession.upsert({
      where: {
        studentId_timetableEntryId_date: {
          studentId: req.user.id,
          timetableEntryId,
          date,
        },
      },
      create: {
        studentId: req.user.id,
        timetableEntryId,
        date,
        status,
      },
      update: {
        status,
        markedAt: new Date(),
      },
      include: {
        timetableEntry: true,
      },
    });

    return sendSuccess(res, session, `Marked as ${status === 'ATTENDED' ? 'Attended' : 'Not Attended'}`);
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceStats(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const studentId = req.user.id;
    const batch = (req.query.batch as string) || 'ALL';

    const where: any = {
      AND: [
        {
          OR: [{ userId: null }, { userId: studentId }],
        },
      ],
    };

    if (batch && batch !== 'ALL') {
      where.AND.push({
        OR: [{ batch: 'ALL' }, { batch: null }, { batch: String(batch).toUpperCase() }],
      });
    }

    // All relevant timetable classes
    const timetable = await prisma.timetableEntry.findMany({
      where,
      orderBy: [{ subject: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // All marked sessions for this student
    const sessions = await prisma.attendanceSession.findMany({
      where: { studentId },
      include: { timetableEntry: true },
      orderBy: { date: 'desc' },
    });

    // Group by unique subject code / subject name
    const subjectMap = new Map<
      string,
      {
        code: string;
        subject: string;
        attended: number;
        notAttended: number;
        total: number;
        faculty: string | null;
        location: string;
      }
    >();

    for (const t of timetable) {
      const key = t.code || t.subject;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          code: key,
          subject: t.subject,
          attended: 0,
          notAttended: 0,
          total: 0,
          faculty: t.facultyName,
          location: t.location,
        });
      }
    }

    let overallAttended = 0;
    let overallRecorded = 0;

    for (const s of sessions) {
      if (!s.timetableEntry) continue;
      const key = s.timetableEntry.code || s.timetableEntry.subject;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          code: key,
          subject: s.timetableEntry.subject,
          attended: 0,
          notAttended: 0,
          total: 0,
          faculty: s.timetableEntry.facultyName,
          location: s.timetableEntry.location,
        });
      }
      const record = subjectMap.get(key)!;
      if (s.status === 'ATTENDED') {
        record.attended += 1;
        record.total += 1;
        overallAttended += 1;
        overallRecorded += 1;
      } else if (s.status === 'NOT_ATTENDED') {
        record.notAttended += 1;
        record.total += 1;
        overallRecorded += 1;
      }
    }

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([key, data]) => {
      const percentage = data.total > 0 ? Math.round((data.attended / data.total) * 100) : null;
      return {
        code: data.code,
        subject: data.subject,
        attended: data.attended,
        notAttended: data.notAttended,
        totalRecorded: data.total,
        percentage, // null if 0 recorded
        isEligible: percentage !== null ? percentage >= 75 : true,
        faculty: data.faculty,
        location: data.location,
      };
    });

    const overallPercentage =
      overallRecorded > 0 ? Math.round((overallAttended / overallRecorded) * 100) : 0;

    return sendSuccess(res, {
      overall: {
        totalAttended: overallAttended,
        totalRecorded: overallRecorded,
        percentage: overallPercentage,
        target: 75,
        isEligible: overallPercentage >= 75,
        hasData: overallRecorded > 0,
      },
      subjectBreakdown,
      timetableCount: timetable.length,
      totalSessionsCount: sessions.length,
    });
  } catch (err) {
    next(err);
  }
}
