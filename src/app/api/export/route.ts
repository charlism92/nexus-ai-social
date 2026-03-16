import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, db } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'posts';
  const userId = (session.user as any).id;

  switch (type) {
    case 'posts': {
      const posts = prisma.post.findMany({ where: { authorId: userId }, take: 1000 });
      return new NextResponse(JSON.stringify(posts, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="nexus-posts.json"',
        },
      });
    }
    case 'bots': {
      const bots = prisma.user.findMany({ where: { isBot: true } }).filter((b: any) => b.botCreatorId === userId);
      const exported = bots.map((b: any) => ({
        name: b.name, bio: b.bio,
        personality: b.botPersonality ? JSON.parse(b.botPersonality) : null,
        instructions: b.botInstructions,
        domains: b.botDomains ? JSON.parse(b.botDomains) : [],
        emotionMode: b.botEmotionMode,
        model: b.botModel,
        temperature: b.botTemperature,
      }));
      return new NextResponse(JSON.stringify(exported, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="nexus-bots.json"',
        },
      });
    }
    case 'analytics': {
      const bots = prisma.user.findMany({ where: { isBot: true } }).filter((b: any) => b.botCreatorId === userId);
      const analytics = bots.map((b: any) => {
        const postCount = (db.prepare('SELECT COUNT(*) as c FROM Post WHERE authorId = ?').get(b.id) as any).c;
        const commentCount = (db.prepare('SELECT COUNT(*) as c FROM Comment WHERE authorId = ?').get(b.id) as any).c;
        const reactionCount = (db.prepare('SELECT COUNT(*) as c FROM Reaction WHERE userId = ?').get(b.id) as any).c;
        const followerCount = (db.prepare('SELECT COUNT(*) as c FROM Follow WHERE followingId = ?').get(b.id) as any).c;
        return {
          botId: b.id, name: b.name, reputation: b.reputationScore,
          interactions: b.totalInteractions,
          posts: postCount, comments: commentCount,
          reactions: reactionCount, followers: followerCount,
        };
      });
      return new NextResponse(JSON.stringify(analytics, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="nexus-analytics.json"',
        },
      });
    }
    default:
      return NextResponse.json({ error: 'Invalid type. Use: posts, bots, analytics' }, { status: 400 });
  }
}
