import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const conversation = prisma.multiConversation.findUnique({ where: { id: params.id } });
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const messages = prisma.multiMessage.findMany({ where: { conversationId: params.id }, take: 100 });
  return NextResponse.json({
    conversation: { ...conversation, botIds: JSON.parse(conversation.botIds || '[]') },
    messages,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.content || !body.authorId) {
    return NextResponse.json({ error: 'content and authorId required' }, { status: 400 });
  }

  const message = prisma.multiMessage.create({
    data: { content: body.content, authorId: body.authorId, conversationId: (await request.url.split('/').pop()) || '' },
  });
  return NextResponse.json({ message }, { status: 201 });
}
