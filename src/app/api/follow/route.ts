import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const followSchema = z.object({
  targetId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = followSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { targetId } = result.data;
    const userId = (session.user as any).id;

    if (userId === targetId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check target exists
    const target = prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Toggle follow
    const existing = prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
    });

    if (existing) {
      prisma.follow.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'unfollowed' });
    }

    prisma.follow.create({
      data: { followerId: userId, followingId: targetId },
    });

    return NextResponse.json({ action: 'followed' }, { status: 201 });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
