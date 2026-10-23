import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import {
  generateComplaintId,
  checkDuplicateComplaints,
} from '../utils/complaintUtils';
import {
  CATEGORY_DEPARTMENT_ROUTING,
  suggestPriority,
  COMPLAINT_STATUSES,
  ComplaintStatus,
} from '../config/constants';
import { createNotification, notifyAllAdmins } from '../services/notificationService';
import { logAudit } from '../utils/auditLogger';

export async function checkDuplicates(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, location, roomNumber, title, description } = req.body;

    if (!category || !title) {
      return next(new AppError('Category and title are required.', 400));
    }

    const duplicates = await checkDuplicateComplaints({
      category,
      location: location || null,
      roomNumber,
      title,
      description: description || '',
    });

    return sendSuccess(res, { duplicates, hasDuplicates: duplicates.length > 0 });
  } catch (err) {
    next(err);
  }
}

export async function createComplaint(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const {
      title,
      description,
      category,
      location,
      roomNumber,
      priority,
      isHazardous,
      affectsClassroom,
      isAnonymous,
    } = req.body;

    if (!title || !description || !category) {
      return next(new AppError('Title, description, and category are required.', 400));
    }

    const complaintId = await generateComplaintId();
    const isAnon = isAnonymous === 'true' || isAnonymous === true;

    // Suggested or chosen priority
    const finalPriority =
      priority ||
      suggestPriority(
        category,
        isHazardous === 'true' || isHazardous === true,
        affectsClassroom === 'true' || affectsClassroom === true
      );

    // Automatic department routing
    const targetDeptName = CATEGORY_DEPARTMENT_ROUTING[category] || 'General Administration';
    let department = await prisma.department.findFirst({
      where: { name: targetDeptName },
    });

    if (!department) {
      const code = targetDeptName.replace(/[^A-Z]/g, '').substring(0, 4) || 'GEN';
      department = await prisma.department.create({
        data: {
          name: targetDeptName,
          code: `${code}-${Math.floor(100 + Math.random() * 900)}`,
        },
      });
    }

    // Optional uploaded image
    const evidenceImage = req.file ? `/uploads/${req.file.filename}` : null;

    // Persist complaint with status history in transaction
    const newComplaint = await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.create({
        data: {
          id: complaintId,
          title: title.trim(),
          description: description.trim(),
          category,
          location: location ? location.trim() : null,
          roomNumber: roomNumber ? roomNumber.trim() : null,
          priority: finalPriority,
          status: 'Submitted',
          isHazardous: isHazardous === 'true' || isHazardous === true,
          affectsClassroom: affectsClassroom === 'true' || affectsClassroom === true,
          isAnonymous: isAnon,
          evidenceImage,
          reporterId: req.user!.id,
          assignedDepartmentId: department.id,
        },
        include: {
          assignedDepartment: true,
          reporter: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: null,
          newStatus: 'Submitted',
          changedById: req.user!.id,
          notes: 'Complaint submitted by student. Auto-routed to ' + department.name,
        },
      });

      // Award 10 improvement points for filing a valid report
      await tx.user.update({
        where: { id: req.user!.id },
        data: { points: { increment: 10 } },
      });

      await tx.improvementPoint.create({
        data: {
          userId: req.user!.id,
          points: 10,
          reason: `Reported issue ${complaint.id}`,
          referenceId: complaint.id,
        },
      });

      return complaint;
    });

    // Notify student
    await createNotification({
      userId: req.user.id,
      title: 'Complaint Submitted',
      message: `Your complaint ${complaintId} has been successfully submitted and routed to ${department.name}.`,
      type: 'COMPLAINT_UPDATE',
      link: `/complaints/${complaintId}`,
    });

    // Notify administrators
    await notifyAllAdmins({
      title: `New Complaint: ${complaintId}`,
      message: `New [${finalPriority}] complaint filed in ${location} (${category}).`,
      type: 'COMPLAINT_UPDATE',
      link: `/complaints/${complaintId}`,
    });

    return sendSuccess(res, newComplaint, 'Complaint submitted successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getComplaints(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const {
      status,
      category,
      priority,
      departmentId,
      location,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Base query filter
    const where: any = {};

    // Role-based scoping
    if (req.user.role === 'STUDENT') {
      where.reporterId = req.user.id;
    } else if (req.user.role === 'STAFF') {
      // Staff see complaints assigned to them personally OR to their department
      const staffConditions: any[] = [{ assignedStaffId: req.user.id }];
      if (req.user.departmentId) {
        staffConditions.push({ assignedDepartmentId: req.user.departmentId });
      }
      where.OR = staffConditions;
    }
    // ADMIN has no reporterId restriction; sees all

    if (status && status !== 'all') {
      where.status = status;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (departmentId && departmentId !== 'all') {
      where.assignedDepartmentId = departmentId;
    }

    if (location && location !== 'all') {
      where.location = location;
    }

    if (search) {
      const searchStr = (search as string).trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { id: { contains: searchStr } },
            { title: { contains: searchStr } },
            { description: { contains: searchStr } },
            { roomNumber: { contains: searchStr } },
          ],
        },
      ];
    }

    const [total, complaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        include: {
          reporter: {
            select: { id: true, name: true, email: true, studentId: true },
          },
          assignedDepartment: {
            select: { id: true, name: true, code: true },
          },
          assignedStaff: {
            select: { id: true, name: true, email: true },
          },
          feedback: {
            select: { rating: true },
          },
          _count: {
            select: { comments: true, verifications: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Enforce server-side identity masking for anonymous complaints
    const maskedComplaints = complaints.map((c: any) => {
      if (c.isAnonymous && req.user!.role !== 'ADMIN' && req.user!.id !== c.reporterId) {
        return {
          ...c,
          reporter: {
            id: null,
            name: 'Anonymous Student',
            email: '',
            studentId: null,
          },
        };
      }
      return c;
    });

    return sendSuccess(res, maskedComplaints, 'Complaints fetched successfully', 200, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplaintById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, email: true, studentId: true, phone: true },
        },
        assignedDepartment: true,
        assignedStaff: {
          select: { id: true, name: true, email: true, phone: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        feedback: true,
        verifications: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!complaint) {
      return next(new AppError('Complaint not found.', 404));
    }

    // Object-level authorization check
    if (req.user.role === 'STUDENT' && complaint.reporterId !== req.user.id) {
      return next(
        new AppError('Access forbidden: You cannot view another student’s private complaint.', 403)
      );
    }

    if (
      req.user.role === 'STAFF' &&
      complaint.assignedStaffId !== req.user.id &&
      complaint.assignedDepartmentId !== req.user.departmentId
    ) {
      return next(
        new AppError('Access forbidden: Complaint is not assigned to you or your department.', 403)
      );
    }

    // Mask reporter identity if complaint was submitted anonymously and requester is not Admin or the reporter
    let responseComplaint: any = complaint;
    if (complaint.isAnonymous && req.user.role !== 'ADMIN' && req.user.id !== complaint.reporterId) {
      responseComplaint = {
        ...complaint,
        reporter: {
          id: null,
          name: 'Anonymous Student',
          email: '',
          studentId: null,
          phone: null,
        },
      };
    }

    return sendSuccess(res, responseComplaint);
  } catch (err) {
    next(err);
  }
}

export async function updateComplaintStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const { status, notes, resolutionNotes } = req.body;

    if (!status || !COMPLAINT_STATUSES.includes(status as ComplaintStatus)) {
      return next(new AppError('Invalid status provided.', 400));
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return next(new AppError('Complaint not found.', 404));
    }

    // Authorization: Staff must be assigned or same department; Admin can update any
    if (req.user.role === 'STAFF') {
      const isAssigned =
        complaint.assignedStaffId === req.user.id ||
        complaint.assignedDepartmentId === req.user.departmentId;
      if (!isAssigned) {
        return next(new AppError('You are not authorized to update this complaint.', 403));
      }
    } else if (req.user.role !== 'ADMIN') {
      return next(new AppError('Only staff and administrators can update status.', 403));
    }

    const oldStatus = complaint.status;
    const isResolving = status === 'Resolved';

    const updated = await prisma.$transaction(async (tx) => {
      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: {
          status,
          ...(isResolving ? { resolvedAt: new Date() } : {}),
          ...(resolutionNotes ? { resolutionNotes: resolutionNotes.trim() } : {}),
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          oldStatus,
          newStatus: status,
          changedById: req.user!.id,
          notes: notes || resolutionNotes || `Status updated from ${oldStatus} to ${status}`,
        },
      });

      return updatedComplaint;
    });

    // Notify student
    await createNotification({
      userId: complaint.reporterId,
      title: `Complaint ${status}: ${id}`,
      message: `Your complaint has been updated to "${status}". ${
        resolutionNotes ? `Resolution Notes: ${resolutionNotes}` : ''
      }`,
      type: 'COMPLAINT_UPDATE',
      link: `/complaints/${id}`,
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_COMPLAINT_STATUS',
      resource: 'Complaint',
      resourceId: id,
      details: `Status transitioned from ${oldStatus} to ${status}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, `Status updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

export async function assignComplaint(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrative authorization required.', 403));
    }

    const { id } = req.params;
    const { departmentId, staffId, notes } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { assignedDepartment: true },
    });

    if (!complaint) {
      return next(new AppError('Complaint not found.', 404));
    }

    let newStatus = complaint.status;
    if (newStatus === 'Submitted' || newStatus === 'Under Review') {
      newStatus = 'Assigned';
    }

    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.complaint.update({
        where: { id },
        data: {
          assignedDepartmentId: departmentId || complaint.assignedDepartmentId,
          assignedStaffId: staffId !== undefined ? staffId : complaint.assignedStaffId,
          status: newStatus,
        },
        include: {
          assignedDepartment: true,
          assignedStaff: true,
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          oldStatus: complaint.status,
          newStatus,
          changedById: req.user!.id,
          notes: notes || `Reassigned by Administrator`,
        },
      });

      return comp;
    });

    // Notify assigned staff if present
    if (staffId) {
      await createNotification({
        userId: staffId,
        title: 'New Complaint Assignment',
        message: `You have been assigned to handle complaint ${id} (${complaint.title}).`,
        type: 'ASSIGNMENT',
        link: `/complaints/${id}`,
      });
    }

    // Notify student
    await createNotification({
      userId: complaint.reporterId,
      title: 'Complaint Assigned',
      message: `Your complaint ${id} has been assigned to ${updated.assignedDepartment?.name || 'department'}.`,
      type: 'COMPLAINT_UPDATE',
      link: `/complaints/${id}`,
    });

    return sendSuccess(res, updated, 'Complaint assigned successfully');
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const { message, isStaffNote } = req.body;

    if (!message || !message.trim()) {
      return next(new AppError('Message is required.', 400));
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return next(new AppError('Complaint not found.', 404));
    }

    // Authorization
    if (
      req.user.role === 'STUDENT' &&
      complaint.reporterId !== req.user.id
    ) {
      return next(new AppError('Forbidden: Cannot comment on another user’s complaint.', 403));
    }

    // Only staff/admin can make an internal staff note
    const canMakeStaffNote =
      (req.user.role === 'STAFF' || req.user.role === 'ADMIN') && Boolean(isStaffNote);

    const comment = await prisma.complaintComment.create({
      data: {
        complaintId: id,
        userId: req.user.id,
        message: message.trim(),
        isStaffNote: canMakeStaffNote,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // If student commented, notify staff/admin
    if (req.user.role === 'STUDENT' && complaint.assignedStaffId) {
      await createNotification({
        userId: complaint.assignedStaffId,
        title: `New Comment on ${id}`,
        message: `Student left a comment on ${id}: "${message.substring(0, 60)}..."`,
        type: 'COMPLAINT_UPDATE',
        link: `/complaints/${id}`,
      });
    }

    return sendSuccess(res, comment, 'Comment posted successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function submitFeedback(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const { rating, comments } = req.body;

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return next(new AppError('Rating must be a number between 1 and 5.', 400));
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { feedback: true },
    });

    if (!complaint) {
      return next(new AppError('Complaint not found.', 404));
    }

    if (complaint.reporterId !== req.user.id) {
      return next(new AppError('Only the reporting student can submit resolution feedback.', 403));
    }

    if (complaint.status !== 'Resolved') {
      return next(new AppError('Feedback can only be provided for resolved complaints.', 400));
    }

    if (complaint.feedback) {
      return next(new AppError('Feedback has already been submitted for this complaint.', 409));
    }

    const feedback = await prisma.$transaction(async (tx) => {
      const fb = await tx.complaintFeedback.create({
        data: {
          complaintId: id,
          studentId: req.user!.id,
          rating: ratingNum,
          comments: comments ? comments.trim() : null,
        },
      });

      // Award 5 reward points for completing resolution feedback
      await tx.user.update({
        where: { id: req.user!.id },
        data: { points: { increment: 5 } },
      });

      await tx.improvementPoint.create({
        data: {
          userId: req.user!.id,
          points: 5,
          reason: `Provided feedback for resolved complaint ${id}`,
          referenceId: id,
        },
      });

      return fb;
    });

    return sendSuccess(res, feedback, 'Feedback submitted successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function reopenComplaint(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return next(new AppError('Reopen reason is required.', 400));
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return next(new AppError('Complaint not found.', 404));
    }

    if (complaint.reporterId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Only the original reporter or admin can reopen this complaint.', 403));
    }

    if (complaint.status !== 'Resolved') {
      return next(new AppError('Only resolved complaints can be reopened.', 400));
    }

    // Check 7-day reopen window rule
    if (complaint.resolvedAt) {
      const daysSinceResolved =
        (Date.now() - new Date(complaint.resolvedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceResolved > 7 && req.user.role !== 'ADMIN') {
        return next(
          new AppError(
            'Reopen window expired. Issues resolved more than 7 days ago cannot be reopened; please submit a new report.',
            400
          )
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.complaint.update({
        where: { id },
        data: {
          status: 'Reopened',
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          oldStatus: 'Resolved',
          newStatus: 'Reopened',
          changedById: req.user!.id,
          notes: `Reopened by user: ${reason.trim()}`,
        },
      });

      return comp;
    });

    // Notify admins and assigned staff
    await notifyAllAdmins({
      title: `Complaint Reopened: ${id}`,
      message: `Student reopened complaint ${id}: "${reason.trim().substring(0, 80)}"`,
      type: 'COMPLAINT_UPDATE',
      link: `/complaints/${id}`,
    });

    if (complaint.assignedStaffId) {
      await createNotification({
        userId: complaint.assignedStaffId,
        title: `Complaint Reopened: ${id}`,
        message: `Complaint ${id} was reopened by the student: "${reason.trim().substring(0, 80)}"`,
        type: 'COMPLAINT_UPDATE',
        link: `/complaints/${id}`,
      });
    }

    return sendSuccess(res, updated, 'Complaint has been reopened');
  } catch (err) {
    next(err);
  }
}

export async function verifyCommunityIssue(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const { stillExists = true, notes } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return next(new AppError('Complaint not found.', 404));
    }

    if (complaint.reporterId === req.user.id) {
      return next(new AppError('You cannot community-verify your own reported complaint.', 400));
    }

    const existingVerification = await prisma.communityVerification.findUnique({
      where: {
        complaintId_userId: {
          complaintId: id,
          userId: req.user.id,
        },
      },
    });

    if (existingVerification) {
      return next(new AppError('You have already verified this infrastructure issue.', 409));
    }

    const verification = await prisma.$transaction(async (tx) => {
      const ver = await tx.communityVerification.create({
        data: {
          complaintId: id,
          userId: req.user!.id,
          stillExists: Boolean(stillExists),
          notes: notes ? notes.trim() : null,
        },
      });

      // Award 2 improvement points
      await tx.user.update({
        where: { id: req.user!.id },
        data: { points: { increment: 2 } },
      });

      await tx.improvementPoint.create({
        data: {
          userId: req.user!.id,
          points: 2,
          reason: `Community verified active status of ${id}`,
          referenceId: id,
        },
      });

      return ver;
    });

    return sendSuccess(res, verification, 'Community verification recorded. +2 Campus Points earned!', 201);
  } catch (err) {
    next(err);
  }
}
