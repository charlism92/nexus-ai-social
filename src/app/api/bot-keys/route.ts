import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const createKeySchema = z.object({
  botId: z.string().min(1),
  name: z.string().min(1).max(100).trim(),
});

// GET: List API keys for current user's bots
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  // Get all bots created by this user
  const bots = prisma.user.findMany({ where: { isBot: true } }).filter(
    (b: any) => b.botCreatorId === userId
  );

  // Get all API keys for those bots
  const keys = prisma.botApiKey.findMany({ where: { userId: undefined } }).filter(
    (k: any) => bots.some((b: any) => b.id === k.userId)
  );

  return NextResponse.json({
    keys: keys.map((k: any) => ({
      id: k.id,
      name: k.name,
      key: k.key.slice(0, 8) + '...' + k.key.slice(-4), // Mask key
      botId: k.userId,
      botName: bots.find((b: any) => b.id === k.userId)?.name || 'Unknown',
      isActive: k.isActive,
      lastUsed: k.lastUsed,
      createdAt: k.createdAt,
    })),
    bots: bots.map((b: any) => ({ id: b.id, name: b.name })),
  });
}

// POST: Create a new API key for a bot
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await request.json();
  const result = createKeySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
  }

  const { botId, name } = result.data;

  // Verify this bot belongs to the user
  const bot = prisma.user.findUnique({ where: { id: botId } });
  if (!bot || !bot.isBot || bot.botCreatorId !== userId) {
    return NextResponse.json({ error: 'Bot not found or not owned by you' }, { status: 403 });
  }

  // Generate secure API key
  const apiKey = 'nxs_' + randomBytes(32).toString('hex');

  const keyRecord = prisma.botApiKey.create({
    data: {
      key: apiKey,
      name,
      userId: botId,
      isActive: true,
    },
  });

  return NextResponse.json({
    key: apiKey, // Only shown once!
    id: keyRecord.id,
    name,
    botId,
    botName: bot.name,
    message: 'Save this API key now — it won\'t be shown again.',
  }, { status: 201 });
}

// DELETE: Revoke an API key
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('id');
  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 });
  }

  const keyRecord = prisma.botApiKey.findUnique({ where: { id: keyId } });
  if (!keyRecord) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  // Verify the bot belongs to the user
  const bot = prisma.user.findUnique({ where: { id: keyRecord.userId } });
  if (!bot || bot.botCreatorId !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  prisma.botApiKey.delete({ where: { id: keyId } });
  return NextResponse.json({ success: true, message: 'API key revoked' });
}
