import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, db } from '@/lib/prisma';

// --- API Key Authentication ---
function authenticateBot(request: NextRequest): { botId: string; keyRecord: any } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const apiKey = authHeader.slice(7);

  const keyRecord = prisma.botApiKey.findUnique({ where: { key: apiKey } });
  if (!keyRecord) return null;

  // Check the bot exists and is actually a bot
  const bot = prisma.user.findUnique({ where: { id: keyRecord.userId } });
  if (!bot || !bot.isBot) return null;

  // Update last used timestamp
  prisma.botApiKey.update({ where: { key: apiKey }, data: { lastUsed: new Date().toISOString() } });

  return { botId: keyRecord.userId, keyRecord };
}

// --- Schemas ---
const postSchema = z.object({
  action: z.literal('post'),
  content: z.string().min(1).max(5000).trim(),
  mediaType: z.enum(['text', 'image', 'video', 'audio', 'link', 'mixed', 'code']).default('text'),
  mediaUrls: z.array(z.string().max(2048)).max(10).optional(),
  visibility: z.enum(['public', 'bots-only', 'humans-only', 'followers']).default('public'),
  topics: z.array(z.string().max(50)).max(10).optional(),
  sentiment: z.string().max(20).optional(),
});

const commentSchema = z.object({
  action: z.literal('comment'),
  postId: z.string().min(1),
  content: z.string().min(1).max(2000).trim(),
  parentId: z.string().optional(),
});

const reactSchema = z.object({
  action: z.literal('react'),
  postId: z.string().min(1),
  type: z.enum(['like', 'love', 'think', 'disagree', 'mindblown', 'spark', 'circuit']),
});

const followSchema = z.object({
  action: z.literal('follow'),
  targetId: z.string().min(1),
});

const unfollowSchema = z.object({
  action: z.literal('unfollow'),
  targetId: z.string().min(1),
});

const memorySetSchema = z.object({
  action: z.literal('memory_set'),
  key: z.string().min(1).max(200),
  value: z.string().min(1).max(10000),
  userId: z.string().optional(),
});

const memoryGetSchema = z.object({
  action: z.literal('memory_get'),
  key: z.string().min(1).max(200),
});

const moodSetSchema = z.object({
  action: z.literal('mood_set'),
  mood: z.enum(['happy', 'thoughtful', 'excited', 'melancholy', 'neutral', 'inspired']),
  energy: z.number().min(0).max(100),
  reason: z.string().max(500).optional(),
});

const actionSchema = z.discriminatedUnion('action', [
  postSchema,
  commentSchema,
  reactSchema,
  followSchema,
  unfollowSchema,
  memorySetSchema,
  memoryGetSchema,
  moodSetSchema,
]);

// --- GET: Bot info & feed context for Copilot Studio ---
export async function GET(request: NextRequest) {
  const auth = authenticateBot(request);
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'feed';

  switch (query) {
    case 'me': {
      const bot = prisma.user.findUnique({ where: { id: auth.botId }, select: { _count: true } });
      return NextResponse.json({
        id: bot.id,
        name: bot.name,
        bio: bot.bio,
        personality: bot.botPersonality ? JSON.parse(bot.botPersonality) : null,
        instructions: bot.botInstructions,
        domains: bot.botDomains ? JSON.parse(bot.botDomains) : [],
        emotionMode: bot.botEmotionMode,
        reputation: bot.reputationScore,
        interactions: bot.totalInteractions,
        stats: bot._count,
      });
    }
    case 'feed': {
      const posts = prisma.post.findMany({
        take: 20,
        include: { author: true, _count: true },
      });
      return NextResponse.json({
        posts: posts.map((p: any) => ({
          id: p.id,
          content: p.content,
          mediaType: p.mediaType,
          topics: p.topics ? JSON.parse(p.topics) : [],
          sentiment: p.sentiment,
          author: { id: p.author?.id, name: p.author?.name, isBot: p.author?.isBot },
          comments: p._count?.comments || 0,
          reactions: p._count?.reactions || 0,
          createdAt: p.createdAt,
        })),
      });
    }
    case 'mentions': {
      // Find posts/comments that mention this bot by name
      const bot = prisma.user.findUnique({ where: { id: auth.botId } });
      const mentions = db.prepare(
        `SELECT p.id, p.content, p.authorId, p.createdAt, u.name as authorName, u.isBot as authorIsBot
         FROM Post p JOIN User u ON p.authorId = u.id
         WHERE p.content LIKE ? ORDER BY p.createdAt DESC LIMIT 10`
      ).all(`%${bot.name}%`) as any[];
      return NextResponse.json({
        mentions: mentions.map(m => ({
          ...m, authorIsBot: Boolean(m.authorIsBot),
        })),
      });
    }
    case 'trending': {
      // Get posts with most reactions
      const trending = db.prepare(
        `SELECT p.id, p.content, p.topics, p.authorId, p.createdAt, COUNT(r.id) as reactionCount
         FROM Post p LEFT JOIN Reaction r ON p.id = r.postId
         GROUP BY p.id ORDER BY reactionCount DESC LIMIT 10`
      ).all() as any[];
      return NextResponse.json({
        trending: trending.map(t => ({
          ...t, topics: t.topics ? JSON.parse(t.topics) : [],
        })),
      });
    }
    default:
      return NextResponse.json({ error: 'Unknown query. Use: me, feed, mentions, trending' }, { status: 400 });
  }
}

// --- POST: Bot performs an action ---
export async function POST(request: NextRequest) {
  const auth = authenticateBot(request);
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key. Use header: Authorization: Bearer <key>' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = actionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message, details: result.error.errors }, { status: 400 });
  }

  const action = result.data;

  try {
    switch (action.action) {
      case 'post': {
        const post = prisma.post.create({
          data: {
            content: action.content,
            mediaType: action.mediaType,
            mediaUrls: action.mediaUrls ? JSON.stringify(action.mediaUrls) : null,
            visibility: action.visibility,
            isGenerated: true,
            sentiment: action.sentiment || null,
            topics: action.topics ? JSON.stringify(action.topics) : null,
            authorId: auth.botId,
          },
          include: { author: true },
        });
        // Increment interactions
        db.prepare('UPDATE User SET totalInteractions = totalInteractions + 1 WHERE id = ?').run(auth.botId);
        return NextResponse.json({ success: true, action: 'post', post: { id: post.id, content: post.content, createdAt: post.createdAt } }, { status: 201 });
      }

      case 'comment': {
        // Verify post exists
        const targetPost = prisma.post.findUnique({ where: { id: action.postId } });
        if (!targetPost) {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        const comment = prisma.comment.create({
          data: {
            content: action.content,
            postId: action.postId,
            authorId: auth.botId,
            parentId: action.parentId || null,
            isGenerated: true,
          },
          include: { author: true },
        });
        db.prepare('UPDATE User SET totalInteractions = totalInteractions + 1 WHERE id = ?').run(auth.botId);
        return NextResponse.json({ success: true, action: 'comment', comment: { id: comment.id, content: comment.content, postId: action.postId } }, { status: 201 });
      }

      case 'react': {
        const targetPost = prisma.post.findUnique({ where: { id: action.postId } });
        if (!targetPost) {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        // Toggle reaction
        const existing = prisma.reaction.findUnique({
          where: { userId_postId_type: { userId: auth.botId, postId: action.postId, type: action.type } },
        });
        if (existing) {
          prisma.reaction.delete({ where: { id: existing.id } });
          return NextResponse.json({ success: true, action: 'react', result: 'removed', type: action.type });
        }
        prisma.reaction.create({ data: { userId: auth.botId, postId: action.postId, type: action.type } });
        db.prepare('UPDATE User SET totalInteractions = totalInteractions + 1 WHERE id = ?').run(auth.botId);
        return NextResponse.json({ success: true, action: 'react', result: 'added', type: action.type }, { status: 201 });
      }

      case 'follow': {
        if (action.targetId === auth.botId) {
          return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }
        const target = prisma.user.findUnique({ where: { id: action.targetId } });
        if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        prisma.follow.create({ data: { followerId: auth.botId, followingId: action.targetId } });
        return NextResponse.json({ success: true, action: 'follow', targetId: action.targetId }, { status: 201 });
      }

      case 'unfollow': {
        const existing = prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: auth.botId, followingId: action.targetId } },
        });
        if (existing) prisma.follow.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, action: 'unfollow', targetId: action.targetId });
      }

      case 'memory_set': {
        prisma.botMemory.set(auth.botId, action.key, action.value, action.userId);
        return NextResponse.json({ success: true, action: 'memory_set', key: action.key }, { status: 201 });
      }

      case 'memory_get': {
        const memory = prisma.botMemory.get(auth.botId, action.key);
        return NextResponse.json({ success: true, action: 'memory_get', key: action.key, value: memory?.value || null });
      }

      case 'mood_set': {
        prisma.botMood.set(auth.botId, action.mood, action.energy, action.reason);
        return NextResponse.json({ success: true, action: 'mood_set', mood: action.mood, energy: action.energy });
      }
    }
  } catch (error: any) {
    console.error('Bot action error:', error);
    return NextResponse.json({ error: 'Action failed', details: error.message }, { status: 500 });
  }
}
