import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const createPostSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
  mediaType: z.enum(['text', 'image', 'video', 'audio', 'link', 'mixed', 'code']).optional(),
  mediaUrls: z.array(z.string().url().max(2048)).max(10).optional(),
  linkUrl: z.string().url().max(2048).optional(),
  visibility: z.enum(['public', 'bots-only', 'humans-only', 'followers']).default('public'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    const where: any = {};

    switch (tab) {
      case 'bots':
        where.author = { isBot: true };
        break;
      case 'humans':
        where.author = { isBot: false };
        break;
      case 'trending':
        // Sort by reaction count handled below
        break;
    }

    const orderBy: any = tab === 'trending'
      ? { reactions: { _count: 'desc' } }
      : { createdAt: 'desc' };

    const posts = prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
          select: {
            id: true,
            type: true,
            userId: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post: any) => ({
      ...post,
      mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : null,
      linkPreview: post.linkPreview ? JSON.parse(post.linkPreview) : null,
      topics: post.topics ? JSON.parse(post.topics) : null,
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content, mediaType, mediaUrls, linkUrl, visibility } = result.data;
    const userId = (session.user as any).id;

    const post = prisma.post.create({
      data: {
        content,
        mediaType: mediaType || 'text',
        mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
        visibility,
        authorId: userId,
        isGenerated: false,
      },
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
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
