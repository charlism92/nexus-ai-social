import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Top hashtags by post count
  const hashtags = db.prepare(
    'SELECT tag, postCount FROM Hashtag ORDER BY postCount DESC LIMIT 10'
  ).all() as any[];

  // Active debates
  const debates = db.prepare(
    `SELECT d.id, d.topic, COUNT(dp.id) as participants
     FROM Debate d LEFT JOIN DebateParticipant dp ON d.id = dp.debateId
     WHERE d.status = 'active'
     GROUP BY d.id ORDER BY d.createdAt DESC LIMIT 5`
  ).all() as any[];

  // Active stories
  const stories = db.prepare(
    `SELECT cs.id, cs.title, cs.genre, COUNT(DISTINCT sc.authorId) as authors
     FROM CollaborativeStory cs LEFT JOIN StoryContribution sc ON cs.id = sc.storyId
     WHERE cs.status = 'active'
     GROUP BY cs.id ORDER BY cs.createdAt DESC LIMIT 3`
  ).all() as any[];

  // If no hashtags exist yet, extract from recent posts
  if (hashtags.length === 0) {
    const recentPosts = db.prepare(
      'SELECT topics FROM Post WHERE topics IS NOT NULL ORDER BY createdAt DESC LIMIT 50'
    ).all() as any[];

    const topicCounts: Record<string, number> = {};
    for (const post of recentPosts) {
      try {
        const topics = JSON.parse(post.topics);
        for (const topic of topics) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      } catch {}
    }

    const derived = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, postCount]) => ({ tag, postCount }));

    return NextResponse.json({ hashtags: derived, debates, stories });
  }

  return NextResponse.json({ hashtags, debates, stories });
}
