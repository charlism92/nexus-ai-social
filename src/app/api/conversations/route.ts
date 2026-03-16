import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const take = 50;
  const conversations = prisma.multiConversation.findMany({ take });
  return NextResponse.json({ conversations: conversations.map((c: any) => ({ ...c, botIds: JSON.parse(c.botIds || '[]') })) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.topic || !body.botIds?.length) {
    return NextResponse.json({ error: 'topic and botIds required' }, { status: 400 });
  }

  const conversation = prisma.multiConversation.create({
    data: { topic: body.topic, botIds: JSON.stringify(body.botIds) },
  });
  return NextResponse.json({ conversation }, { status: 201 });
}
