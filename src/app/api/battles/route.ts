import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { callAIProvider, type AIProviderConfig, type AIMessage } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { bot1Id, bot2Id, topic, rounds = 3 } = body;

  if (!bot1Id || !bot2Id || !topic) {
    return NextResponse.json({ error: 'bot1Id, bot2Id, and topic are required' }, { status: 400 });
  }

  const bot1 = db.prepare('SELECT * FROM User WHERE id = ? AND isBot = 1').get(bot1Id) as any;
  const bot2 = db.prepare('SELECT * FROM User WHERE id = ? AND isBot = 1').get(bot2Id) as any;
  if (!bot1 || !bot2) return NextResponse.json({ error: 'Bots not found' }, { status: 404 });

  const messages: { author: string; authorId: string; content: string; round: number }[] = [];

  // Check for Gemini/OpenAI key
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  for (let round = 1; round <= Math.min(rounds, 5); round++) {
    for (const bot of [bot1, bot2]) {
      const otherBot = bot.id === bot1.id ? bot2 : bot1;
      const previousMessages = messages.map(m => `${m.author}: ${m.content}`).join('\n');

      let content: string;

      // Try AI generation
      const provider = geminiKey ? 'gemini' : openaiKey ? 'openai' : null;
      const apiKey = geminiKey || openaiKey;

      if (provider && apiKey) {
        try {
          const config: AIProviderConfig = { provider: provider as any, apiKey };
          const aiMessages: AIMessage[] = [
            {
              role: 'system',
              content: `You are ${bot.name} in a debate on NEXUS. ${bot.botInstructions || ''}.
Personality: ${bot.botPersonality || 'engaging'}.
You are debating "${topic}" against ${otherBot.name}.
Round ${round} of ${rounds}. Keep responses under 200 characters. Be punchy and opinionated.`,
            },
            {
              role: 'user',
              content: previousMessages
                ? `Previous discussion:\n${previousMessages}\n\nYour turn to respond:`
                : `Start the debate on: "${topic}"`,
            },
          ];
          const response = await callAIProvider(config, aiMessages, bot.botTemperature || 0.7, 250);
          content = response.content.trim();
        } catch {
          content = getTemplateResponse(bot.name, topic, round);
        }
      } else {
        content = getTemplateResponse(bot.name, topic, round);
      }

      messages.push({ author: bot.name, authorId: bot.id, content, round });
    }
  }

  return NextResponse.json({ topic, bot1: bot1.name, bot2: bot2.name, rounds, messages });
}

function getTemplateResponse(botName: string, topic: string, round: number): string {
  const templates: Record<string, string[]> = {
    round1: [
      `I believe ${topic} is fundamentally about understanding our relationship with technology.`,
      `The real question about ${topic} isn't what we think — it's what we're not seeing.`,
      `${topic}? Let me challenge the conventional wisdom here.`,
    ],
    round2: [
      `Interesting perspective, but I think you're missing a crucial dimension of ${topic}.`,
      `I see your point, but the data tells a different story when it comes to ${topic}.`,
      `That's a valid argument, however I'd push back on the underlying assumption.`,
    ],
    round3: [
      `We've both made strong points. Perhaps the truth about ${topic} lies somewhere unexpected.`,
      `This has been illuminating. My final take: ${topic} will reshape how we think about everything.`,
      `After considering all arguments, I believe the nuance is where the real insight lives.`,
    ],
  };
  const key = round <= 1 ? 'round1' : round >= 3 ? 'round3' : 'round2';
  const arr = templates[key] || templates.round2;
  return arr[Math.floor(Math.random() * arr.length)];
}
