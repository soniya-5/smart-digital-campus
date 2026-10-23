import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import { logAudit } from '../utils/auditLogger';

// ======================== MARKETPLACE ========================

export async function getMarketplaceListings(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, status = 'AVAILABLE', search } = req.query;

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const listings = await prisma.marketplaceListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return sendSuccess(res, listings);
  } catch (err) {
    next(err);
  }
}

export async function createMarketplaceListing(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { title, description, category, price, condition, contactMethod } = req.body;

    if (!title || !description || !category || price === undefined) {
      return next(new AppError('Title, description, category, and price are required.', 400));
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return next(new AppError('Price must be a positive number or zero.', 400));
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const listing = await prisma.marketplaceListing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        price: priceNum,
        condition: condition || 'Good',
        contactMethod: contactMethod || 'Campus Messaging',
        sellerId: req.user.id,
        image,
      },
      include: {
        seller: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return sendSuccess(res, listing, 'Marketplace listing created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateMarketplaceListing(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const { title, description, category, price, condition, contactMethod, status } = req.body;

    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
    if (!listing) {
      return next(new AppError('Listing not found.', 404));
    }

    // Object-level authorization: Only owner or admin
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Access forbidden: You cannot modify another user’s listing.', 403));
    }

    const updated = await prisma.marketplaceListing.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(category ? { category } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(condition ? { condition } : {}),
        ...(contactMethod ? { contactMethod } : {}),
        ...(status ? { status } : {}),
        ...(req.file ? { image: `/uploads/${req.file.filename}` } : {}),
      },
    });

    return sendSuccess(res, updated, 'Listing updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteMarketplaceListing(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });

    if (!listing) {
      return next(new AppError('Listing not found.', 404));
    }

    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Access forbidden: You cannot delete another user’s listing.', 403));
    }

    await prisma.marketplaceListing.delete({ where: { id } });
    return sendSuccess(res, null, 'Listing deleted successfully');
  } catch (err) {
    next(err);
  }
}

// ======================== STUDY GROUPS ========================

export async function getStudyGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const { subject, search } = req.query;

    const where: any = {};
    if (subject && subject !== 'all') {
      where.subject = subject;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { course: { contains: q } },
      ];
    }

    const groups = await prisma.studyGroup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, studentId: true } },
          },
        },
      },
    });

    return sendSuccess(res, groups);
  } catch (err) {
    next(err);
  }
}

export async function createStudyGroup(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { title, description, subject, course, meetingMode, schedule, capacity } = req.body;

    if (!title || !description || !subject || !course || !schedule) {
      return next(new AppError('Title, description, subject, course, and schedule are required.', 400));
    }

    const maxCap = parseInt(capacity, 10) || 6;

    const group = await prisma.studyGroup.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        course: course.trim(),
        meetingMode: meetingMode || 'Hybrid',
        schedule: schedule.trim(),
        capacity: maxCap,
        creatorId: req.user.id,
        members: {
          create: {
            userId: req.user.id, // Creator is automatically first member
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true } },
        members: true,
      },
    });

    return sendSuccess(res, group, 'Study group created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function joinStudyGroup(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;

    const group = await prisma.studyGroup.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!group) {
      return next(new AppError('Study group not found.', 404));
    }

    // Check duplicate membership
    const isMember = group.members.some((m) => m.userId === req.user!.id);
    if (isMember) {
      return next(new AppError('You are already a member of this study group.', 409));
    }

    // Check capacity limit
    if (group.members.length >= group.capacity) {
      return next(new AppError('This study group has reached maximum member capacity.', 400));
    }

    const membership = await prisma.studyGroupMember.create({
      data: {
        groupId: id,
        userId: req.user.id,
      },
    });

    return sendSuccess(res, membership, 'Successfully joined study group', 201);
  } catch (err) {
    next(err);
  }
}

export async function leaveStudyGroup(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;

    const membership = await prisma.studyGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      return next(new AppError('You are not a member of this study group.', 404));
    }

    await prisma.studyGroupMember.delete({
      where: {
        groupId_userId: {
          groupId: id,
          userId: req.user.id,
        },
      },
    });

    return sendSuccess(res, null, 'Left study group successfully');
  } catch (err) {
    next(err);
  }
}

// ======================== FACILITY RATINGS ========================

export async function getFacilityRatings(req: Request, res: Response, next: NextFunction) {
  try {
    const { facilityName } = req.query;
    const where: any = {};
    if (facilityName && facilityName !== 'all') {
      where.facilityName = facilityName;
    }

    const ratings = await prisma.facilityRating.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Compute facility averages
    const averages: Record<string, { sum: number; count: number; avg: number }> = {};
    for (const r of ratings) {
      if (!averages[r.facilityName]) {
        averages[r.facilityName] = { sum: 0, count: 0, avg: 0 };
      }
      averages[r.facilityName].sum += r.rating;
      averages[r.facilityName].count++;
    }

    Object.keys(averages).forEach((f) => {
      averages[f].avg = Math.round((averages[f].sum / averages[f].count) * 10) / 10;
    });

    return sendSuccess(res, { ratings, averages });
  } catch (err) {
    next(err);
  }
}

export async function submitFacilityRating(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { facilityName, category, rating, comments } = req.body;

    if (!facilityName || !rating) {
      return next(new AppError('Facility name and rating are required.', 400));
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return next(new AppError('Rating must be between 1 and 5.', 400));
    }

    const newRating = await prisma.facilityRating.create({
      data: {
        facilityName: facilityName.trim(),
        category: category || 'Campus Facility',
        rating: ratingNum,
        comments: comments ? comments.trim() : null,
        userId: req.user.id,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return sendSuccess(res, newRating, 'Feedback recorded successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ======================== LOST AND FOUND ========================

export async function getLostAndFound(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, status, search } = req.query;

    const where: any = {};
    if (type && type !== 'all') {
      where.type = type;
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      const q = (search as string).trim();
      where.OR = [
        { itemName: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const items = await prisma.lostAndFoundItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function createLostAndFound(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { type, itemName, description, category, location, contactInfo } = req.body;

    if (!type || !itemName || !description || !location) {
      return next(new AppError('Type, item name, description, and location are required.', 400));
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await prisma.lostAndFoundItem.create({
      data: {
        type: type.toUpperCase(), // LOST or FOUND
        itemName: itemName.trim(),
        description: description.trim(),
        category: category || 'Other',
        location: location.trim(),
        contactInfo: contactInfo ? contactInfo.trim() : null,
        reporterId: req.user.id,
        image,
      },
      include: {
        reporter: { select: { id: true, name: true } },
      },
    });

    return sendSuccess(res, item, 'Report submitted successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateLostAndFoundStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const { id } = req.params;
    const { status } = req.body;

    const item = await prisma.lostAndFoundItem.findUnique({ where: { id } });
    if (!item) {
      return next(new AppError('Item report not found.', 404));
    }

    if (item.reporterId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(new AppError('Access forbidden: Only reporter or admin can update status.', 403));
    }

    const updated = await prisma.lostAndFoundItem.update({
      where: { id },
      data: { status },
    });

    return sendSuccess(res, updated, `Status updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

// ======================== CANTEEN MENU ========================

export async function getCanteenMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, isVeg } = req.query;

    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    if (isVeg !== undefined && isVeg !== 'all') {
      where.isVeg = isVeg === 'true';
    }

    const items = await prisma.canteenMenuItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function createCanteenItem(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrator authorization required.', 403));
    }

    const { name, category, price, isVeg, isAvailable, description } = req.body;

    if (!name || !category || price === undefined) {
      return next(new AppError('Name, category, and price are required.', 400));
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await prisma.canteenMenuItem.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        price: parseFloat(price),
        isVeg: isVeg === 'true' || isVeg === true,
        isAvailable: isAvailable === undefined ? true : (isAvailable === 'true' || isAvailable === true),
        description: description ? description.trim() : null,
        image,
      },
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_CANTEEN_ITEM',
      resource: 'CanteenMenuItem',
      resourceId: item.id,
      details: `Added menu item: ${item.name} ($${item.price})`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, item, 'Menu item created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCanteenItem(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrator authorization required.', 403));
    }

    const { id } = req.params;
    const { name, category, price, isVeg, isAvailable, description } = req.body;

    const updated = await prisma.canteenMenuItem.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(category ? { category: category.trim() } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(isVeg !== undefined ? { isVeg: isVeg === 'true' || isVeg === true } : {}),
        ...(isAvailable !== undefined ? { isAvailable: isAvailable === 'true' || isAvailable === true } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(req.file ? { image: `/uploads/${req.file.filename}` } : {}),
      },
    });

    return sendSuccess(res, updated, 'Menu item updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteCanteenItem(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return next(new AppError('Administrator authorization required.', 403));
    }

    const { id } = req.params;
    await prisma.canteenMenuItem.delete({ where: { id } });
    return sendSuccess(res, null, 'Menu item deleted successfully');
  } catch (err) {
    next(err);
  }
}
