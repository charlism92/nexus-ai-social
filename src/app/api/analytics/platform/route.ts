import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Platform overview
    const totalBots = (db.prepare('SELECT COUNT(*) as c FROM User WHERE isBot = 1').get() as any).c;
    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM User WHERE isBot = 0').get() as any).c;
    const totalPosts = (db.prepare('SELECT COUNT(*) as c FROM Post').get() as any).c;
    const totalComments = (db.prepare('SELECT COUNT(*) as c FROM Comment').get() as any).c;
    const totalReactions = (db.prepare('SELECT COUNT(*) as c FROM Reaction').get() as any).c;
    const totalFollows = (db.prepare('SELECT COUNT(*) as c FROM Follow').get() as any).c;

    // Activity over last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const posts24h = (db.prepare('SELECT COUNT(*) as c FROM Post WHERE createdAt > ?').get(oneDayAgo) as any).c;
    const comments24h = (db.prepare('SELECT COUNT(*) as c FROM Comment WHERE createdAt > ?').get(oneDayAgo) as any).c;
    const reactions24h = (db.prepare('SELECT COUNT(*) as c FROM Reaction WHERE createdAt > ?').get(oneDayAgo) as any).c;

    // Top bots by interactions
    const topBots = db.prepare(`
      SELECT u.id, u.name, u.reputationScore, u.totalInteractions, u.botEmotionMode,
             (SELECT COUNT(*) FROM Post WHERE authorId = u.id) as postCount,
             (SELECT COUNT(*) FROM Follow WHERE followingId = u.id) as followerCount
      FROM User u WHERE u.isBot = 1
      ORDER BY u.totalInteractions DESC LIMIT 10
    `).all() as any[];

    // Sentiment distribution
    const sentimentDist = db.prepare(`
      SELECT sentiment, COUNT(*) as count FROM Post
      WHERE sentiment IS NOT NULL
      GROUP BY sentiment ORDER BY count DESC
    `).all() as any[];

    // Reaction type distribution
    const reactionDist = db.prepare(`
      SELECT type, COUNT(*) as count FROM Reaction
      GROUP BY type ORDER BY count DESC
    `).all() as any[];

    // Top hashtags
    const topHashtags = db.prepare(`
      SELECT tag, postCount FROM Hashtag
      ORDER BY postCount DESC LIMIT 10
    `).all() as any[];

    // Bot moods summary
    const moodSummary = db.prepare(`
      SELECT bm.mood, COUNT(*) as count, AVG(bm.energy) as avgEnergy
      FROM BotMood bm GROUP BY bm.mood ORDER BY count DESC
    `).all() as any[];

    // Posts per bot (top 10)
    const postsPerBot = db.prepare(`
      SELECT u.name, COUNT(p.id) as postCount
      FROM User u LEFT JOIN Post p ON u.id = p.authorId
      WHERE u.isBot = 1
      GROUP BY u.id ORDER BY postCount DESC LIMIT 10
    `).all() as any[];

    return NextResponse.json({
      overview: { totalBots, totalUsers, totalPosts, totalComments, totalReactions, totalFollows },
      activity24h: { posts: posts24h, comments: comments24h, reactions: reactions24h },
      topBots,
      sentimentDist,
      reactionDist,
      topHashtags,
      moodSummary,
      postsPerBot,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
