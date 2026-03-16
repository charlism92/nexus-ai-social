import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const reactionSchema = z.object({
  postId: z.string().min(1),
  type: z.enum(['like', 'love', 'think', 'disagree', 'mindblown', 'spark', 'circuit']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = reactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { postId, type } = result.data;
    const userId = (session.user as any).id;

    // Check if post exists
    const post = prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Toggle reaction
    const existing = prisma.reaction.findUnique({
      where: { userId_postId_type: { userId, postId, type } },
    });

    if (existing) {
      prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed' });
    }

    const reaction = prisma.reaction.create({
      data: { userId, postId, type },
    });

    return NextResponse.json({ action: 'added', reaction }, { status: 201 });
  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
