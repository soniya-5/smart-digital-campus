import { Router } from 'express';
import {
  getTimetable,
  createTimetableEntry,
  deleteTimetableEntry,
  getEvents,
  createEvent,
  registerForEvent,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  getExams,
  createExam,
  getAttendance,
  recordAttendance,
  getAttendanceSessions,
  markAttendanceSession,
  getAttendanceStats,
} from '../controllers/academicController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Timetable
router.get('/timetable', authenticate, getTimetable);
router.post('/timetable', authenticate, createTimetableEntry);
router.delete('/timetable/:id', authenticate, deleteTimetableEntry);

// Calendar & Events
router.get('/events', authenticate, getEvents);
router.post('/events', authenticate, requireRole('ADMIN', 'STAFF'), createEvent);
router.post('/events/:id/register', authenticate, registerForEvent);

// Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', authenticate, requireRole('ADMIN'), createAnnouncement);
router.put('/announcements/:id', authenticate, requireRole('ADMIN'), updateAnnouncement);

// Exams
router.get('/exams', getExams);
router.post('/exams', authenticate, requireRole('ADMIN'), createExam);

// Attendance Tracker
router.get('/attendance', authenticate, getAttendance);
router.post('/attendance', authenticate, recordAttendance);
router.get('/attendance/sessions', authenticate, getAttendanceSessions);
router.post('/attendance/mark', authenticate, markAttendanceSession);
router.get('/attendance/stats', authenticate, getAttendanceStats);

export default router;
