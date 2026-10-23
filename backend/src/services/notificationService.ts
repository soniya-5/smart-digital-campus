import { prisma } from '../config/db';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: 'COMPLAINT_UPDATE' | 'ASSIGNMENT' | 'ANNOUNCEMENT' | 'SOS' | 'GENERAL';
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

export async function notifyUsers(
  userIds: string[],
  params: {
    title: string;
    message: string;
    type: 'COMPLAINT_UPDATE' | 'ASSIGNMENT' | 'ANNOUNCEMENT' | 'SOS' | 'GENERAL';
    link?: string;
  }
) {
  try {
    const notifications = userIds.map((userId) => ({
      userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
    }));

    return await prisma.notification.createMany({
      data: notifications,
    });
  } catch (err) {
    console.error('Failed to create batch notifications:', err);
  }
}

export async function notifyAllAdmins(params: {
  title: string;
  message: string;
  type: 'COMPLAINT_UPDATE' | 'ASSIGNMENT' | 'ANNOUNCEMENT' | 'SOS' | 'GENERAL';
  link?: string;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length > 0) {
      await notifyUsers(
        admins.map((a) => a.id),
        params
      );
    }
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
}
