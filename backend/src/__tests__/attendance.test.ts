import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/db';

describe('Timetable and Attendance Tracker Integration Suite', () => {
  let studentCookie: string;
  let studentId: string;
  let sampleEntryId: string;
  let sampleEntryId2: string;

  beforeAll(async () => {
    // Register a test student for attendance tests
    const res = await request(app).post('/api/auth/register').send({
      email: 'attendance.test@campus.edu',
      password: 'Password@123',
      name: 'Timetable Test Student',
      studentId: 'STU-TT-01',
    });
    studentCookie = res.headers['set-cookie'][0];
    studentId = res.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.attendanceSession.deleteMany({
      where: { studentId },
    });
    await prisma.user.deleteMany({
      where: { id: studentId },
    });
    await prisma.$disconnect();
  });

  it('1. GET /api/academic/timetable should return official S.E. (III) timetable entries', async () => {
    const res = await request(app).get('/api/academic/timetable').set('Cookie', studentCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metadata.className).toContain('S.E. (III)');
    expect(res.body.data.metadata.classroom).toBe('005');
    expect(res.body.data.entries.length).toBeGreaterThan(30);

    // Filter by batch A
    const resBatchA = await request(app)
      .get('/api/academic/timetable?batch=A')
      .set('Cookie', studentCookie);
    expect(resBatchA.status).toBe(200);
    // Batch A should contain ALL and A entries, but not B or C specific practicals
    const batches = resBatchA.body.data.entries.map((e: any) => e.batch);
    expect(batches).toContain('A');
    expect(batches).not.toContain('B');
  });

  it('2. GET /api/academic/attendance/sessions should return day sessions with UNMARKED status', async () => {
    // Check Monday
    const res = await request(app)
      .get('/api/academic/attendance/sessions?date=2026-10-26&day=Monday&batch=A')
      .set('Cookie', studentCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessions.length).toBeGreaterThan(0);

    // All should initially be UNMARKED
    const unmarked = res.body.data.sessions.every((s: any) => s.status === 'UNMARKED');
    expect(unmarked).toBe(true);

    sampleEntryId = res.body.data.sessions[0].timetableEntryId;
    sampleEntryId2 = res.body.data.sessions[1].timetableEntryId;
  });

  it('3. POST /api/academic/attendance/mark should mark Attended and Not Attended', async () => {
    // Mark first class as ATTENDED
    const res1 = await request(app)
      .post('/api/academic/attendance/mark')
      .set('Cookie', studentCookie)
      .send({
        timetableEntryId: sampleEntryId,
        date: '2026-10-26',
        status: 'ATTENDED',
      });
    if (res1.status !== 200) {
      console.log('MARK ERROR:', res1.status, res1.body, 'sampleEntryId:', sampleEntryId);
    }
    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.status).toBe('ATTENDED');

    // Mark second class as NOT_ATTENDED
    const res2 = await request(app)
      .post('/api/academic/attendance/mark')
      .set('Cookie', studentCookie)
      .send({
        timetableEntryId: sampleEntryId2,
        date: '2026-10-26',
        status: 'NOT_ATTENDED',
      });
    expect(res2.status).toBe(200);
    expect(res2.body.data.status).toBe('NOT_ATTENDED');
  });

  it('4. GET /api/academic/attendance/stats should calculate exact subject & overall percentages', async () => {
    const res = await request(app)
      .get('/api/academic/attendance/stats?batch=A')
      .set('Cookie', studentCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Overall: 1 attended, 1 not attended -> Total recorded = 2, Overall % = 50%
    const overall = res.body.data.overall;
    expect(overall.totalAttended).toBe(1);
    expect(overall.totalRecorded).toBe(2);
    expect(overall.percentage).toBe(50);
    expect(overall.isEligible).toBe(false); // below 75%

    // Subject breakdown exists and includes percentage calculations
    const breakdown = res.body.data.subjectBreakdown;
    expect(Array.isArray(breakdown)).toBe(true);
    expect(breakdown.length).toBeGreaterThan(0);
  });
});
