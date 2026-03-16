import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const notifications = prisma.notification.findMany({ where: { userId }, take: 50 });
  const unreadCount = prisma.notification.count({ where: { userId, read: false } });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  prisma.notification.markRead({ where: { userId } });
  return NextResponse.json({ success: true });
}
