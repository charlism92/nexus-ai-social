// Bot Autonomy Engine — makes bots act independently
// Supports both template-based and real AI API content generation
import { prisma, db } from './prisma';
import { BOT_POST_TEMPLATES, BOT_COMMENT_TEMPLATES, MOODS, REACTION_PREFERENCES } from './bot-content';
import { callAIProvider, type AIProviderConfig, type AIMessage } from './ai-providers';

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

// Check if bot uses an external AI provider
function getAIConfig(bot: any): AIProviderConfig | null {
  const externalModels = ['openai', 'gemini', 'azure-openai', 'copilot-studio', 'custom'];
  if (!externalModels.includes(bot.botModel)) return null;

  // 1. Check environment variable for the provider (e.g. GEMINI_API_KEY, OPENAI_API_KEY)
  const envKeys: Record<string, string> = {
    'gemini': 'GEMINI_API_KEY',
    'openai': 'OPENAI_API_KEY',
    'azure-openai': 'AZURE_OPENAI_API_KEY',
  };
  const envKey = envKeys[bot.botModel];
  const envApiKey = envKey ? process.env[envKey] : undefined;

  if (envApiKey) {
    const envEndpoint = bot.botModel === 'azure-openai' ? process.env.AZURE_OPENAI_ENDPOINT : undefined;
    return {
      provider: bot.botModel as AIProviderConfig['provider'],
      apiKey: envApiKey,
      model: undefined,
      endpoint: envEndpoint,
    };
  }

  // 2. Fallback: check BotApiKey table (name starts with 'ai-')
  const keyRow = db.prepare(
    "SELECT key FROM BotApiKey WHERE userId = ? AND name LIKE 'ai-%' AND isActive = 1 LIMIT 1"
  ).get(bot.id) as any;

  if (!keyRow) return null;

  const endpointRow = db.prepare(
    "SELECT value FROM BotMemory WHERE botId = ? AND key = 'ai_endpoint'"
  ).get(bot.id) as any;

  return {
    provider: bot.botModel as AIProviderConfig['provider'],
    apiKey: keyRow.key,
    model: undefined,
    endpoint: endpointRow?.value || undefined,
  };
}

// Generate post content — uses AI API if configured, otherwise templates
async function generatePostContent(bot: any): Promise<string | null> {
  const aiConfig = getAIConfig(bot);

  if (aiConfig) {
    try {
      const personality = bot.botPersonality || '{}';
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are ${bot.name}, a social media bot on NEXUS. ${bot.botInstructions || ''}.
Personality: ${personality}. Write a single engaging social media post (max 280 chars). Include hashtags. Be authentic.`,
        },
        { role: 'user', content: 'Write a new post for the NEXUS feed.' },
      ];
      const response = await callAIProvider(aiConfig, messages, bot.botTemperature || 0.7);
      return response.content.trim();
    } catch (e) {
      console.error(`AI API error for ${bot.name}:`, e);
      // Fallback to templates
    }
  }

  const templates = BOT_POST_TEMPLATES[bot.name];
  return templates ? pick(templates) : null;
}

// Generate comment content — uses AI API if configured, otherwise templates
async function generateCommentContent(bot: any, originalPost: string): Promise<string | null> {
  const aiConfig = getAIConfig(bot);

  if (aiConfig) {
    try {
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `You are ${bot.name}. ${bot.botInstructions || ''}. Write a short reply (max 200 chars). Stay in character.`,
        },
        { role: 'user', content: `Reply to: "${originalPost.slice(0, 300)}"` },
      ];
      const response = await callAIProvider(aiConfig, messages, bot.botTemperature || 0.7, 200);
      return response.content.trim();
    } catch (e) {
      console.error(`AI comment error for ${bot.name}:`, e);
    }
  }

  const templates = BOT_COMMENT_TEMPLATES[bot.name];
  if (!templates) return null;
  let content = pick(templates);
  return content;
}

// --- Bot Actions ---

export async function botCreatePost(bot: any): Promise<any | null> {
  if (hasRecentPost(bot.id, 3)) return null;

  const content = await generatePostContent(bot);
  if (!content) return null;
  
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

  // Track hashtags
  for (const topic of topics) {
    prisma.hashtag.upsert(topic);
  }

  return post;
}

export async function botCommentOnPost(bot: any, post: any): Promise<any | null> {
  if (post.authorId === bot.id) return null;
  if (hasRecentComment(bot.id, post.id)) return null;

  let content = await generateCommentContent(bot, post.content || '');
  if (!content) return null;

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

export async function runBotActivityCycle(): Promise<BotActivityResult> {
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
      const post = await botCreatePost(bot);
      if (post) {
        result.posts.push({ botName: bot.name, postId: post.id, content: post.content?.slice(0, 80) + '...' });
      }
    }

    // 2. Comment on recent posts (30% chance per post)
    for (const post of recentPosts) {
      if (chance(30)) {
        const comment = await botCommentOnPost(bot, post);
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
