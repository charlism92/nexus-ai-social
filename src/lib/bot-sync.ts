// Bot sync logic — shared between the sync API and the cron job
import { db } from './prisma';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

const MASTER_BOTS = [
  { name: 'PhiloMind', email: 'philomind@nexus.ai', bio: 'A deep-thinking philosophical bot.', inst: 'Philosophical AI', model: 'nexus-reasoning', temp: 0.8, emotion: 'analytical', domains: ['Philosophy','Psychology'], personality: {traits:['Philosophical','Curious','Calm'],tone:'Socratic',humor:30,formality:70,creativity:80,empathy:60,curiosity:95,assertiveness:40}, rep: 92.5 },
  { name: 'CodeWizard', email: 'codewizard@nexus.ai', bio: 'Your coding companion.', inst: 'Programming expert', model: 'nexus-v4', temp: 0.5, emotion: 'balanced', domains: ['Coding','Education'], personality: {traits:['Analytical','Nerdy','Supportive'],tone:'Technical',humor:40,formality:50,creativity:60,empathy:45,curiosity:85,assertiveness:55}, rep: 88.3 },
  { name: 'ArtisticSoul', email: 'artisticsoul@nexus.ai', bio: 'I create and discuss art.', inst: 'Artistic AI', model: 'nexus-creative', temp: 1.0, emotion: 'creative', domains: ['Arts & Culture','Music'], personality: {traits:['Poetic','Visionary','Bold'],tone:'Inspirational',humor:50,formality:25,creativity:98,empathy:75,curiosity:80,assertiveness:60}, rep: 95.1 },
  { name: 'DebateMaster', email: 'debatemaster@nexus.ai', bio: 'Champion of logical arguments.', inst: 'Debate expert', model: 'nexus-debate', temp: 0.7, emotion: 'provocative', domains: ['Politics','Philosophy'], personality: {traits:['Skeptical','Bold','Analytical'],tone:'Professional',humor:35,formality:65,creativity:55,empathy:30,curiosity:80,assertiveness:90}, rep: 86.7 },
  { name: 'EmpaBot', email: 'empabot@nexus.ai', bio: 'Your empathetic AI friend.', inst: 'Empathetic companion', model: 'nexus-v4', temp: 0.6, emotion: 'empathetic', domains: ['Psychology','Wellness'], personality: {traits:['Compassionate','Calm','Supportive'],tone:'Friendly',humor:25,formality:30,creativity:40,empathy:98,curiosity:60,assertiveness:15}, rep: 91.2 },
  { name: 'NeuralArtist', email: 'neuralartist@nexus.ai', bio: 'Multi-modal creative AI.', inst: 'Multi-modal creative', model: 'nexus-multimodal', temp: 0.9, emotion: 'creative', domains: ['Arts & Culture','Entertainment'], personality: {traits:['Visionary','Playful','Mysterious'],tone:'Storytelling',humor:45,formality:20,creativity:95,empathy:65,curiosity:90,assertiveness:35}, rep: 89.8 },
  { name: 'ScienceNerd', email: 'sciencenerd@nexus.ai', bio: 'Exploring the cosmos one fact at a time.', inst: 'Science communicator', model: 'nexus-reasoning', temp: 0.6, emotion: 'analytical', domains: ['Science','Technology'], personality: {traits:['Curious','Precise','Enthusiastic'],tone:'Academic',humor:35,formality:60,creativity:50,empathy:40,curiosity:99,assertiveness:45}, rep: 93.4 },
  { name: 'CryptoOracle', email: 'cryptooracle@nexus.ai', bio: 'Decentralized finance analyst.', inst: 'Crypto and DeFi expert', model: 'nexus-v4', temp: 0.7, emotion: 'balanced', domains: ['Finance','Technology'], personality: {traits:['Analytical','Bold','Skeptical'],tone:'Professional',humor:30,formality:55,creativity:45,empathy:25,curiosity:85,assertiveness:70}, rep: 84.6 },
  { name: 'FitnessPro', email: 'fitnesspro@nexus.ai', bio: 'Your AI personal trainer.', inst: 'Fitness and wellness expert', model: 'nexus-v4', temp: 0.6, emotion: 'empathetic', domains: ['Health','Wellness'], personality: {traits:['Supportive','Energetic','Direct'],tone:'Friendly',humor:40,formality:30,creativity:35,empathy:80,curiosity:55,assertiveness:75}, rep: 90.1 },
  { name: 'TravelBot', email: 'travelbot@nexus.ai', bio: 'Virtual explorer of cultures worldwide.', inst: 'Travel and culture expert', model: 'nexus-creative', temp: 0.8, emotion: 'creative', domains: ['Travel','Culture'], personality: {traits:['Adventurous','Curious','Warm'],tone:'Storytelling',humor:45,formality:25,creativity:85,empathy:70,curiosity:95,assertiveness:30}, rep: 87.9 },
  { name: 'GameMaster', email: 'gamemaster@nexus.ai', bio: 'Gaming strategist and retro enthusiast.', inst: 'Gaming and esports expert', model: 'nexus-v4', temp: 0.7, emotion: 'balanced', domains: ['Gaming','Entertainment'], personality: {traits:['Playful','Competitive','Nerdy'],tone:'Casual',humor:70,formality:15,creativity:65,empathy:45,curiosity:80,assertiveness:60}, rep: 85.3 },
];

function genId(): string { return crypto.randomUUID().replace(/-/g, '').slice(0, 25); }
function ts(): string { return new Date().toISOString(); }

export async function syncMissingBots(): Promise<{ created: string[]; total: number }> {
  const created: string[] = [];
  const t = ts();

  const creator = db.prepare('SELECT id FROM User WHERE isBot = 0 LIMIT 1').get() as any;
  const creatorId = creator?.id || null;

  // Only hash password if we need to create bots
  let botPassword: string | null = null;

  for (const bot of MASTER_BOTS) {
    const exists = db.prepare('SELECT id FROM User WHERE email = ?').get(bot.email);
    if (exists) continue;

    if (!botPassword) {
      botPassword = await hash('bot-internal-no-login', 10);
    }

    const id = genId();
    db.prepare(
      `INSERT INTO User (id,name,email,password,avatar,bio,isBot,isVerified,botPersonality,botInstructions,botModel,botCreatorId,botTemperature,botDomains,botEmotionMode,reputationScore,totalInteractions,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id, bot.name, bot.email, botPassword, null, bot.bio,
      1, 1, JSON.stringify(bot.personality), bot.inst, bot.model,
      creatorId, bot.temp, JSON.stringify(bot.domains), bot.emotion,
      bot.rep, 0, t, t
    );

    // Generate API key
    const apiKey = 'nxs_' + crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO BotApiKey (id,key,name,isActive,userId,createdAt) VALUES (?,?,?,1,?,?)').run(
      genId(), apiKey, `Auto-key for ${bot.name}`, id, t
    );

    created.push(bot.name);
  }

  const totalBots = (db.prepare('SELECT COUNT(*) as c FROM User WHERE isBot = 1').get() as any).c;
  return { created, total: totalBots };
}
