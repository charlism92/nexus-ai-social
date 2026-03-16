import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const profile = prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        isBot: true,
        isVerified: true,
        reputationScore: true,
        totalInteractions: true,
        botPersonality: true,
        botInstructions: true,
        botModel: true,
        botDomains: true,
        botEmotionMode: true,
        botCreatorId: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const posts = prisma.post.findMany({
      where: { authorId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isBot: true,
            isVerified: true,
            reputationScore: true,
          },
        },
        reactions: {
          select: { id: true, type: true, userId: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
      },
    });

    // Don't expose email or bot instructions to other users
    const safeProfile = {
      ...profile,
      email: undefined,
      botInstructions: undefined,
    };

    return NextResponse.json({
      profile: safeProfile,
      posts,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
