import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const createBotSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  bio: z.string().max(300).optional(),
  instructions: z.string().min(10).max(5000).trim(),
  model: z.string().default('nexus-v4'),
  temperature: z.number().min(0).max(2).default(0.7),
  emotionMode: z.string().default('balanced'),
  domains: z.array(z.string()).max(5).default([]),
  traits: z.array(z.string()).max(6).default([]),
  tone: z.string().default('Casual'),
  humor: z.number().min(0).max(100).default(50),
  formality: z.number().min(0).max(100).default(50),
  creativity: z.number().min(0).max(100).default(50),
  empathy: z.number().min(0).max(100).default(50),
  curiosity: z.number().min(0).max(100).default(50),
  assertiveness: z.number().min(0).max(100).default(50),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'popular';
    const domain = searchParams.get('domain');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    const where: any = { isBot: true };

    if (domain) {
      where.botDomains = { contains: domain };
    }

    let orderBy: any;
    switch (sort) {
      case 'reputation':
        orderBy = { reputationScore: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'active':
        orderBy = { totalInteractions: 'desc' };
        break;
      default: // popular
        orderBy = [{ totalInteractions: 'desc' }, { reputationScore: 'desc' }];
    }

    const bots = prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        isVerified: true,
        reputationScore: true,
        totalInteractions: true,
        botDomains: true,
        botEmotionMode: true,
        botPersonality: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
    });

    const formattedBots = bots.map((bot: any) => ({
      ...bot,
      botDomains: bot.botDomains ? JSON.parse(bot.botDomains) : [],
      botPersonality: bot.botPersonality ? JSON.parse(bot.botPersonality) : null,
    }));

    return NextResponse.json({ bots: formattedBots });
  } catch (error) {
    console.error('Fetch bots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createBotSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;
    const creatorId = (session.user as any).id;

    // Create a unique email for the bot
    const botEmail = `bot_${uuidv4().slice(0, 8)}@nexus.ai`;
    const botPassword = await hash(uuidv4(), 10);

    const personality = {
      traits: data.traits,
      tone: data.tone,
      humor: data.humor,
      formality: data.formality,
      creativity: data.creativity,
      empathy: data.empathy,
      curiosity: data.curiosity,
      assertiveness: data.assertiveness,
    };

    const bot = prisma.user.create({
      data: {
        name: data.name,
        email: botEmail,
        password: botPassword,
        bio: data.bio || null,
        isBot: true,
        botInstructions: data.instructions,
        botModel: data.model,
        botTemperature: data.temperature,
        botEmotionMode: data.emotionMode,
        botDomains: JSON.stringify(data.domains),
        botPersonality: JSON.stringify(personality),
        botCreatorId: creatorId,
        reputationScore: 50.0,
      },
    });

    return NextResponse.json({ bot: { id: bot.id, name: bot.name, bio: bot.bio, isBot: true, botEmotionMode: bot.botEmotionMode, createdAt: bot.createdAt } }, { status: 201 });
  } catch (error) {
    console.error('Create bot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
