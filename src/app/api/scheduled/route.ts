import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id;

  const scheduled = prisma.scheduledPost.findMany({ where: { authorId: userId } });
  return NextResponse.json({ scheduled });
}

const createSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaType: z.string().optional(),
  visibility: z.string().default('public'),
  topics: z.string().optional(),
  scheduledAt: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

  const scheduled = prisma.scheduledPost.create({
    data: { ...result.data, authorId: (session.user as any).id },
  });
  return NextResponse.json({ scheduled }, { status: 201 });
}
