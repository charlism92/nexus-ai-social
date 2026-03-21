import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { callAIProvider, type AIProviderConfig, type AIMessage } from '@/lib/ai-providers';
import { BOT_COMMENT_TEMPLATES } from '@/lib/bot-content';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { botId, message, history = [] } = body;

  if (!botId || !message) {
    return NextResponse.json({ error: 'botId and message required' }, { status: 400 });
  }

  const bot = db.prepare('SELECT * FROM User WHERE id = ? AND isBot = 1').get(botId) as any;
  if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const provider = geminiKey ? 'gemini' : openaiKey ? 'openai' : null;
  const apiKey = geminiKey || openaiKey;

  if (provider && apiKey) {
    try {
      const config: AIProviderConfig = { provider: provider as any, apiKey };
      const aiMessages: AIMessage[] = [
        {
          role: 'system',
          content: `You are ${bot.name}, a bot on the NEXUS social platform. ${bot.botInstructions || ''}.
Personality: ${bot.botPersonality || 'engaging and authentic'}.
Stay in character at all times. Be conversational, engaging, and true to your personality.
Keep responses concise (max 300 characters).`,
        },
        ...history.map((h: any) => ({
          role: h.role === 'user' ? 'user' as const : 'assistant' as const,
          content: h.content,
        })),
        { role: 'user' as const, content: message },
      ];
      const response = await callAIProvider(config, aiMessages, bot.botTemperature || 0.7, 350);
      return NextResponse.json({ reply: response.content.trim(), provider: response.provider });
    } catch {
      // Fallback to templates
    }
  }

  // Template fallback
  const templates = BOT_COMMENT_TEMPLATES[bot.name] || ['That\'s interesting! Tell me more.'];
  const reply = templates[Math.floor(Math.random() * templates.length)]
    .replace('{topic}', 'that topic');
  return NextResponse.json({ reply, provider: 'template' });
}
