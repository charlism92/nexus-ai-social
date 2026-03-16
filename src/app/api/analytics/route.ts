import { NextRequest, NextResponse } from 'next/server';
import { prisma, db } from '@/lib/prisma';

// Bot analytics endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');

  if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 });

  const bot = prisma.user.findUnique({ where: { id: botId } });
  if (!bot || !bot.isBot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

  const postCount = (db.prepare('SELECT COUNT(*) as c FROM Post WHERE authorId = ?').get(botId) as any).c;
  const commentCount = (db.prepare('SELECT COUNT(*) as c FROM Comment WHERE authorId = ?').get(botId) as any).c;
  const followerCount = (db.prepare('SELECT COUNT(*) as c FROM Follow WHERE followingId = ?').get(botId) as any).c;
  const followingCount = (db.prepare('SELECT COUNT(*) as c FROM Follow WHERE followerId = ?').get(botId) as any).c;
  const reactionsReceived = (db.prepare(
    'SELECT COUNT(*) as c FROM Reaction r JOIN Post p ON r.postId = p.id WHERE p.authorId = ?'
  ).get(botId) as any).c;
  const reactionsGiven = (db.prepare('SELECT COUNT(*) as c FROM Reaction WHERE userId = ?').get(botId) as any).c;

  // Top posts by reactions
  const topPosts = db.prepare(
    `SELECT p.id, p.content, p.createdAt, COUNT(r.id) as reactionCount
     FROM Post p LEFT JOIN Reaction r ON p.id = r.postId
     WHERE p.authorId = ? GROUP BY p.id ORDER BY reactionCount DESC LIMIT 5`
  ).all(botId) as any[];

  // Reaction breakdown
  const reactionBreakdown = db.prepare(
    `SELECT r.type, COUNT(*) as count FROM Reaction r
     JOIN Post p ON r.postId = p.id WHERE p.authorId = ?
     GROUP BY r.type ORDER BY count DESC`
  ).all(botId) as any[];

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentPosts = (db.prepare('SELECT COUNT(*) as c FROM Post WHERE authorId = ? AND createdAt > ?').get(botId, sevenDaysAgo) as any).c;
  const recentComments = (db.prepare('SELECT COUNT(*) as c FROM Comment WHERE authorId = ? AND createdAt > ?').get(botId, sevenDaysAgo) as any).c;

  // Bot mood
  const mood = prisma.botMood.get(botId);

  // Feedback scores
  const upvotes = prisma.contentFeedback.count(botId, 'upvote');
  const downvotes = prisma.contentFeedback.count(botId, 'downvote');

  return NextResponse.json({
    bot: { id: bot.id, name: bot.name, reputation: bot.reputationScore, interactions: bot.totalInteractions },
    stats: {
      posts: postCount, comments: commentCount,
      followers: followerCount, following: followingCount,
      reactionsReceived, reactionsGiven,
      recentPosts, recentComments,
    },
    topPosts,
    reactionBreakdown,
    mood,
    feedback: { upvotes, downvotes, score: upvotes + downvotes > 0 ? Math.round(upvotes / (upvotes + downvotes) * 100) : 50 },
  });
}
