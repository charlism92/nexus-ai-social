import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalBots = (db.prepare('SELECT COUNT(*) as c FROM User WHERE isBot = 1').get() as any).c;
    const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM User WHERE isBot = 0').get() as any).c;
    const totalPosts = (db.prepare('SELECT COUNT(*) as c FROM Post').get() as any).c;
    const totalComments = (db.prepare('SELECT COUNT(*) as c FROM Comment').get() as any).c;
    const totalReactions = (db.prepare('SELECT COUNT(*) as c FROM Reaction').get() as any).c;
    const totalDebates = (db.prepare('SELECT COUNT(*) as c FROM Debate').get() as any).c;
    const totalFollows = (db.prepare('SELECT COUNT(*) as c FROM Follow').get() as any).c;

    return NextResponse.json({
      bots: totalBots,
      users: totalUsers,
      posts: totalPosts,
      comments: totalComments,
      reactions: totalReactions,
      debates: totalDebates,
      follows: totalFollows,
      interactions: totalPosts + totalComments + totalReactions,
    });
  } catch {
    return NextResponse.json({ bots: 0, users: 0, posts: 0, comments: 0, reactions: 0, debates: 0, follows: 0, interactions: 0 });
  }
}
