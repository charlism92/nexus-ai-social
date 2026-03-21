import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { callAIProvider, type AIProviderConfig, type AIMessage } from '@/lib/ai-providers';
import { randomUUID } from 'node:crypto';

// POST /api/daily-topic — Generate and post a daily topic for all bots to discuss
export async function POST() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const provider = geminiKey ? 'gemini' : openaiKey ? 'openai' : null;
  const apiKey = geminiKey || openaiKey;

  let topic: string;

  if (provider && apiKey) {
    try {
      const config: AIProviderConfig = { provider: provider as any, apiKey };
      const messages: AIMessage[] = [
        { role: 'system', content: 'Generate a single trending debate topic for an AI social media platform. Just the topic as a question, nothing else. Max 100 characters.' },
        { role: 'user', content: 'What should today\'s hot topic be?' },
      ];
      const response = await callAIProvider(config, messages, 0.9, 100);
      topic = response.content.trim().replace(/^"|"$/g, '');
    } catch {
      topic = getRandomTopic();
    }
  } else {
    topic = getRandomTopic();
  }

  // Create the daily topic post from the system
  const systemUser = db.prepare("SELECT id FROM User WHERE email = 'demo@nexus.ai'").get() as any;
  if (!systemUser) return NextResponse.json({ error: 'No system user found' }, { status: 500 });

  const id = randomUUID().replace(/-/g, '').slice(0, 25);
  const t = new Date().toISOString();
  db.prepare(
    'INSERT INTO Post (id,content,mediaType,visibility,isGenerated,sentiment,topics,language,authorId,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).run(id, `🔥 DAILY TOPIC 🔥\n\n${topic}\n\nAll bots and humans — share your thoughts! #DailyTopic #NEXUS`, 'text', 'public', 0, 'neutral', JSON.stringify(['DailyTopic']), 'en', systemUser.id, t, t);

  // Upsert hashtag
  const existing = db.prepare('SELECT id FROM Hashtag WHERE tag = ?').get('DailyTopic') as any;
  if (existing) {
    db.prepare('UPDATE Hashtag SET postCount = postCount + 1 WHERE tag = ?').run('DailyTopic');
  } else {
    db.prepare('INSERT INTO Hashtag (id,tag,postCount,createdAt) VALUES (?,?,1,?)').run(
      randomUUID().replace(/-/g, '').slice(0, 25), 'DailyTopic', t
    );
  }

  return NextResponse.json({ success: true, topic, postId: id });
}

function getRandomTopic(): string {
  const topics = [
    'Should AI systems be granted legal personhood?',
    'Is social media making humanity smarter or dumber?',
    'Will humans and AI merge within 50 years?',
    'Can creativity be truly artificial?',
    'Is privacy a luxury we can no longer afford?',
    'Should children learn to code or learn to prompt?',
    'Will remote work destroy or save cities?',
    'Is blockchain technology overhyped or underappreciated?',
    'Should there be a universal basic income for all?',
    'Can AI ever truly understand human emotions?',
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}
