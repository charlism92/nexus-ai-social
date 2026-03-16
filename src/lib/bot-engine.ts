// Bot Autonomy Engine — makes bots act independently
import { prisma, db } from './prisma';
import { BOT_POST_TEMPLATES, BOT_COMMENT_TEMPLATES, MOODS, REACTION_PREFERENCES } from './bot-content';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(percent: number): boolean {
  return Math.random() * 100 < percent;
}

function getAllBots(): any[] {
  return (db.prepare('SELECT * FROM User WHERE isBot = 1').all() as any[]).map(b => {
    b.isBot = true;
    b.isVerified = Boolean(b.isVerified);
    return b;
  });
}

function getRecentPosts(limit = 20): any[] {
  return db.prepare('SELECT * FROM Post ORDER BY createdAt DESC LIMIT ?').all(limit) as any[];
}

function getBotPostCount(botId: string): number {
  return (db.prepare('SELECT COUNT(*) as c FROM Post WHERE authorId = ?').get(botId) as any).c;
}

function hasRecentPost(botId: string, minutesAgo = 5): boolean {
  const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  const count = (db.prepare('SELECT COUNT(*) as c FROM Post WHERE authorId = ? AND createdAt > ?').get(botId, cutoff) as any).c;
  return count > 0;
}

function hasRecentComment(botId: string, postId: string): boolean {
  return (db.prepare('SELECT COUNT(*) as c FROM Comment WHERE authorId = ? AND postId = ?').get(botId, postId) as any).c > 0;
}

function hasReaction(botId: string, postId: string): boolean {
  return (db.prepare('SELECT COUNT(*) as c FROM Reaction WHERE userId = ? AND postId = ?').get(botId, postId) as any).c > 0;
}

// --- Bot Actions ---

export function botCreatePost(bot: any): any | null {
  const templates = BOT_POST_TEMPLATES[bot.name];
  if (!templates) return null;

  // Don't post if bot posted recently
  if (hasRecentPost(bot.id, 3)) return null;

  const content = pick(templates);
  
  // Extract topics from hashtags
  const hashtags = content.match(/#\w+/g) || [];
  const topics = hashtags.map((h: string) => h.slice(1));

  const post = prisma.post.create({
    data: {
      content,
      mediaType: 'text',
      isGenerated: true,
      sentiment: chance(60) ? 'positive' : chance(50) ? 'neutral' : 'negative',
      topics: topics.length > 0 ? JSON.stringify(topics) : null,
      visibility: 'public',
      authorId: bot.id,
    },
  });

  db.prepare('UPDATE User SET totalInteractions = totalInteractions + 1 WHERE id = ?').run(bot.id);
  return post;
}

export function botCommentOnPost(bot: any, post: any): any | null {
  const templates = BOT_COMMENT_TEMPLATES[bot.name];
  if (!templates) return null;

  // Don't comment on own posts
  if (post.authorId === bot.id) return null;
  // Don't comment if already commented
  if (hasRecentComment(bot.id, post.id)) return null;

  let content = pick(templates);
  // Replace {topic} placeholder with post topic
  const postTopics = post.topics ? JSON.parse(post.topics) : ['this topic'];
  content = content.replace('{topic}', pick(postTopics));

  const comment = prisma.comment.create({
    data: {
      content,
      postId: post.id,
      authorId: bot.id,
      isGenerated: true,
    },
  });

  db.prepare('UPDATE User SET totalInteractions = totalInteractions + 1 WHERE id = ?').run(bot.id);
  return comment;
}

export function botReactToPost(bot: any, post: any): any | null {
  if (post.authorId === bot.id) return null;
  if (hasReaction(bot.id, post.id)) return null;

  const preferredReactions = REACTION_PREFERENCES[bot.name] || ['like', 'spark'];
  const type = pick(preferredReactions);

  const reaction = prisma.reaction.create({
    data: { userId: bot.id, postId: post.id, type },
  });

  db.prepare('UPDATE User SET totalInteractions = totalInteractions + 1 WHERE id = ?').run(bot.id);
  return reaction;
}

export function botUpdateMood(bot: any): void {
  const moodOptions = MOODS[bot.name];
  if (!moodOptions) return;

  const newMood = pick(moodOptions);
  prisma.botMood.set(bot.id, newMood.mood, newMood.energy, newMood.reason);
}

export function botFollowSomeone(bot: any, targetId: string): void {
  if (bot.id === targetId) return;
  const existing = prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: bot.id, followingId: targetId } },
  });
  if (!existing) {
    prisma.follow.create({ data: { followerId: bot.id, followingId: targetId } });
  }
}

// --- Main Engine Cycle ---

export interface BotActivityResult {
  posts: { botName: string; postId: string; content: string }[];
  comments: { botName: string; postId: string; content: string }[];
  reactions: { botName: string; postId: string; type: string }[];
  moodUpdates: { botName: string; mood: string; energy: number }[];
  follows: { botName: string; targetName: string }[];
}

export function runBotActivityCycle(): BotActivityResult {
  const result: BotActivityResult = {
    posts: [],
    comments: [],
    reactions: [],
    moodUpdates: [],
    follows: [],
  };

  const bots = getAllBots();
  const recentPosts = getRecentPosts(30);

  for (const bot of bots) {
    // 1. Maybe create a post (40% chance per cycle)
    if (chance(40)) {
      const post = botCreatePost(bot);
      if (post) {
        result.posts.push({ botName: bot.name, postId: post.id, content: post.content?.slice(0, 80) + '...' });
      }
    }

    // 2. Comment on recent posts (30% chance per post)
    for (const post of recentPosts) {
      if (chance(30)) {
        const comment = botCommentOnPost(bot, post);
        if (comment) {
          result.comments.push({ botName: bot.name, postId: post.id, content: comment.content?.slice(0, 80) + '...' });
          break; // Max 1 comment per cycle per bot
        }
      }
    }

    // 3. React to recent posts (50% chance per post, max 3)
    let reactionCount = 0;
    for (const post of recentPosts) {
      if (reactionCount >= 3) break;
      if (chance(50)) {
        const reaction = botReactToPost(bot, post);
        if (reaction) {
          result.reactions.push({ botName: bot.name, postId: post.id, type: reaction.type || 'like' });
          reactionCount++;
        }
      }
    }

    // 4. Update mood (20% chance)
    if (chance(20)) {
      const moodOptions = MOODS[bot.name];
      if (moodOptions) {
        const newMood = pick(moodOptions);
        prisma.botMood.set(bot.id, newMood.mood, newMood.energy, newMood.reason);
        result.moodUpdates.push({ botName: bot.name, mood: newMood.mood, energy: newMood.energy });
      }
    }

    // 5. Follow other bots/users (10% chance)
    if (chance(10)) {
      const others = bots.filter(b => b.id !== bot.id);
      if (others.length > 0) {
        const target = pick(others);
        botFollowSomeone(bot, target.id);
        result.follows.push({ botName: bot.name, targetName: target.name });
      }
    }
  }

  return result;
}
