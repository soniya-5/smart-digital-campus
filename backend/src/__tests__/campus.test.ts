import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/db';
import { calculateCampusHealthScore } from '../utils/healthScore';

describe('Smart Digital Campus API Suite', () => {
  let studentCookie: string;
  let studentTwoCookie: string;
  let adminCookie: string;
  let createdComplaintId: string;

  beforeAll(async () => {
    // Clean test users if they exist
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test.stu1@campus.edu', 'test.stu2@campus.edu', 'test.adm@campus.edu'],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.complaint.deleteMany({
      where: { title: { contains: 'Test Suite Complaint' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test.stu1@campus.edu', 'test.stu2@campus.edu', 'test.adm@campus.edu'],
        },
      },
    });
    await prisma.$disconnect();
  });

  it('1. GET /api/health should return UP status and database CONNECTED', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.database).toBe('CONNECTED');
  });

  it('2. POST /api/auth/register should allow student registration and forbid ADMIN role injection', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test.stu1@campus.edu',
      password: 'SecurePass@123',
      name: 'Test Student One',
      studentId: 'STU-TEST-001',
      role: 'ADMIN', // malicious role attempt in payload
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Server MUST enforce STUDENT role despite 'ADMIN' in payload
    expect(res.body.data.user.role).toBe('STUDENT');

    // Extract cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    studentCookie = cookies[0];
  });

  it('3. Register second student for privacy verification', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test.stu2@campus.edu',
      password: 'SecurePass@123',
      name: 'Test Student Two',
      studentId: 'STU-TEST-002',
    });
    expect(res.status).toBe(201);
    studentTwoCookie = res.headers['set-cookie'][0];
  });

  it('4. POST /api/complaints allows student to submit complaint with real generated ID', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Cookie', studentCookie)
      .send({
        title: 'Test Suite Complaint: Broken Water Pipe',
        description: 'Water pipe leaking in ground floor washroom',
        category: 'Plumbing',
        location: 'Academic Block A (Engineering)',
        roomNumber: 'Washroom GF',
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^CMP-\d{4}-\d{4}$/);
    createdComplaintId = res.body.data.id;
  });

  it('5. Student can view their own complaint', async () => {
    const res = await request(app)
      .get(`/api/complaints/${createdComplaintId}`)
      .set('Cookie', studentCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdComplaintId);
  });

  it('6. Unauthorized student CANNOT access another student private complaint (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/complaints/${createdComplaintId}`)
      .set('Cookie', studentTwoCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('7. Unauthenticated request to protected routes is rejected with 401', async () => {
    const res = await request(app).get('/api/complaints');
    expect(res.status).toBe(401);
  });

  it('8. Student cannot call administrative endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', studentCookie);

    expect(res.status).toBe(403);
  });

  it('9. Timetable prevents overlapping entries on same day', async () => {
    // Add first class
    const res1 = await request(app)
      .post('/api/academic/timetable')
      .set('Cookie', studentCookie)
      .send({
        subject: 'Algorithms',
        dayOfWeek: 'Monday',
        startTime: '10:00',
        endTime: '11:30',
        location: 'Room 101',
      });
    expect(res1.status).toBe(201);

    // Attempt overlapping class (10:30 to 12:00)
    const res2 = await request(app)
      .post('/api/academic/timetable')
      .set('Cookie', studentCookie)
      .send({
        subject: 'Computer Networks',
        dayOfWeek: 'Monday',
        startTime: '10:30',
        endTime: '12:00',
        location: 'Room 205',
      });
    expect(res2.status).toBe(400);
    expect(res2.body.error).toContain('Time conflict detected');
  });

  it('10. Campus Health Score calculates transparent bounded score', async () => {
    const health = await calculateCampusHealthScore();
    expect(health.score).toBeGreaterThanOrEqual(10);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(health.grade).toBeDefined();
    expect(health.formulaDescription).toBeDefined();
  });
});
