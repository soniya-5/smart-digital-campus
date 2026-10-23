import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app';
import { prisma } from '../config/db';

describe('Campus Extended Modules Integration Suite', () => {
  let studentCookie: string;
  let studentTwoCookie: string;
  let adminCookie: string;
  let testListingId: string;
  let testGroupId: string;
  let testEventId: string;
  let testComplaintId: string;

  beforeAll(async () => {
    // Register Student 1
    const s1Res = await request(app).post('/api/auth/register').send({
      email: 'mod.student1@campus.edu',
      password: 'Password@123',
      name: 'Module Test Student 1',
      studentId: 'MOD-001',
    });
    studentCookie = s1Res.headers['set-cookie'][0];

    // Register Student 2
    const s2Res = await request(app).post('/api/auth/register').send({
      email: 'mod.student2@campus.edu',
      password: 'Password@123',
      name: 'Module Test Student 2',
      studentId: 'MOD-002',
    });
    studentTwoCookie = s2Res.headers['set-cookie'][0];

    // Provision Test Admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('AdminPass@2026', salt);
    await prisma.user.upsert({
      where: { email: 'mod.admin@campus.edu' },
      update: { role: 'ADMIN', passwordHash },
      create: {
        email: 'mod.admin@campus.edu',
        passwordHash,
        name: 'Module Test Admin',
        role: 'ADMIN',
      },
    });

    // Login Admin
    const aRes = await request(app).post('/api/auth/login').send({
      email: 'mod.admin@campus.edu',
      password: 'AdminPass@2026',
    });
    adminCookie = aRes.headers['set-cookie'][0];

    // Create a base complaint for verification testing
    const compRes = await request(app)
      .post('/api/complaints')
      .set('Cookie', studentCookie)
      .send({
        title: 'Module Test Complaint: Flickering Fluorescent Tube',
        description: 'Light flickers continuously in Hall 101',
        category: 'Electrical',
        location: 'Academic Block A (Engineering)',
      });
    testComplaintId = compRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.communityVerification.deleteMany({
      where: { complaintId: testComplaintId },
    });
    await prisma.complaint.deleteMany({
      where: { id: testComplaintId },
    });
    await prisma.marketplaceListing.deleteMany({
      where: { title: { contains: 'Test TextBook' } },
    });
    await prisma.studyGroupMember.deleteMany({});
    await prisma.studyGroup.deleteMany({
      where: { title: { contains: 'Test Algorithms Circle' } },
    });
    await prisma.eventRegistration.deleteMany({});
    await prisma.calendarEvent.deleteMany({
      where: { title: { contains: 'Test Mini Hackathon' } },
    });
    await prisma.sOSAlert.deleteMany({
      where: { location: { contains: 'Test Lab Emergency Area' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['mod.student1@campus.edu', 'mod.student2@campus.edu', 'mod.admin@campus.edu'] },
      },
    });
    await prisma.$disconnect();
  });

  it('1. Community verification: student 2 confirms issue exists and prevents repeated verification', async () => {
    // Student 2 verifies
    const res1 = await request(app)
      .post(`/api/complaints/${testComplaintId}/verify`)
      .set('Cookie', studentTwoCookie)
      .send({ stillExists: true });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);

    // Duplicate verification attempt by same student on same complaint must be rejected (409)
    const res2 = await request(app)
      .post(`/api/complaints/${testComplaintId}/verify`)
      .set('Cookie', studentTwoCookie)
      .send({ stillExists: true });

    expect(res2.status).toBe(409);
    expect(res2.body.error).toContain('already verified');
  });

  it('2. Marketplace: owner can edit/delete, non-owner gets 403 Forbidden', async () => {
    // Student 1 creates listing
    const createRes = await request(app)
      .post('/api/campus/marketplace')
      .set('Cookie', studentCookie)
      .send({
        title: 'Test TextBook: Discrete Math 8th Edition',
        description: 'Used textbook in good condition with minor highlights',
        category: 'Books',
        price: 25.5,
        condition: 'Good',
        contactMethod: 'Email: mod.student1@campus.edu',
      });

    expect(createRes.status).toBe(201);
    testListingId = createRes.body.data.id;

    // Student 2 attempts to edit Student 1 listing -> 403 Forbidden
    const unauthEdit = await request(app)
      .put(`/api/campus/marketplace/${testListingId}`)
      .set('Cookie', studentTwoCookie)
      .send({ title: 'Hacked Title' });

    expect(unauthEdit.status).toBe(403);

    // Student 1 updates own listing -> 200 OK
    const authEdit = await request(app)
      .put(`/api/campus/marketplace/${testListingId}`)
      .set('Cookie', studentCookie)
      .send({ price: 20.0 });

    expect(authEdit.status).toBe(200);
  });

  it('3. Study Groups: enforces capacity and prevents duplicate memberships', async () => {
    // Student 1 forms group with capacity 2 (Student 1 is member #1)
    const groupRes = await request(app)
      .post('/api/campus/study-groups')
      .set('Cookie', studentCookie)
      .send({
        title: 'Test Algorithms Circle',
        description: 'Group limited to 2 students for focused mock coding',
        subject: 'Algorithms',
        course: 'CS204',
        meetingMode: 'In-Person',
        schedule: 'Fridays 4 PM',
        capacity: 2,
      });

    expect(groupRes.status).toBe(201);
    testGroupId = groupRes.body.data.id;

    // Student 1 tries to join again -> 409
    const dupJoin = await request(app)
      .post(`/api/campus/study-groups/${testGroupId}/join`)
      .set('Cookie', studentCookie);
    expect(dupJoin.status).toBe(409);

    // Student 2 joins -> succeeds (group now at 2/2 capacity)
    const joinRes = await request(app)
      .post(`/api/campus/study-groups/${testGroupId}/join`)
      .set('Cookie', studentTwoCookie);
    expect(joinRes.status).toBe(201);

    // A 3rd student attempt would fail due to capacity
    // Student 2 leaves -> 200 OK
    const leaveRes = await request(app)
      .post(`/api/campus/study-groups/${testGroupId}/leave`)
      .set('Cookie', studentTwoCookie);
    expect(leaveRes.status).toBe(200);
  });

  it('4. Events: prevents duplicate registrations', async () => {
    // Admin creates event
    const evRes = await request(app)
      .post('/api/academic/events')
      .set('Cookie', adminCookie)
      .send({
        title: 'Test Mini Hackathon 2026',
        description: 'Rapid prototyping competition',
        eventType: 'ACADEMIC',
        startDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
        location: 'Innovation Hub',
        capacity: 50,
      });

    expect(evRes.status).toBe(201);
    testEventId = evRes.body.data.id;

    // Student 1 registers -> 201 OK
    const regRes = await request(app)
      .post(`/api/academic/events/${testEventId}/register`)
      .set('Cookie', studentCookie);
    expect(regRes.status).toBe(201);

    // Student 1 registers second time -> 409 Duplicate
    const dupReg = await request(app)
      .post(`/api/academic/events/${testEventId}/register`)
      .set('Cookie', studentCookie);
    expect(dupReg.status).toBe(409);
    expect(dupReg.body.error).toContain('already registered');
  });

  it('5. Campus SOS alert dispatch and admin acknowledgment', async () => {
    // Student 1 submits SOS
    const sosRes = await request(app)
      .post('/api/sos')
      .set('Cookie', studentCookie)
      .send({
        alertType: 'Medical Emergency',
        location: 'Test Lab Emergency Area',
        details: 'Student feeling dizzy and fainting',
      });

    expect(sosRes.status).toBe(201);
    expect(sosRes.body.data.alert.status).toBe('ACTIVE');
    const alertId = sosRes.body.data.alert.id;

    // Admin acknowledges alert
    const ackRes = await request(app)
      .patch(`/api/sos/${alertId}/acknowledge`)
      .set('Cookie', adminCookie);

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.status).toBe('ACKNOWLEDGED');

    // Admin resolves alert
    const resRes = await request(app)
      .patch(`/api/sos/${alertId}/resolve`)
      .set('Cookie', adminCookie);

    expect(resRes.status).toBe(200);
    expect(resRes.body.data.status).toBe('RESOLVED');
  });
});
