import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');
  if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 });

  const webhooks = prisma.webhook.findMany({ where: { botId } });
  return NextResponse.json({ webhooks });
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url().max(2048),
  events: z.array(z.string()).min(1),
  botId: z.string().min(1),
  secret: z.string().max(256).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

  const webhook = prisma.webhook.create({
    data: { ...result.data, events: JSON.stringify(result.data.events) },
  });
  return NextResponse.json({ webhook }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
