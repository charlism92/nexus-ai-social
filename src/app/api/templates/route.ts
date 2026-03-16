import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const templates = prisma.botTemplate.findMany({ where: { category, isPublic: true }, take: 50 });
  return NextResponse.json({ templates });
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  personality: z.string(),
  instructions: z.string().min(10).max(5000),
  domains: z.string(),
  emotionMode: z.string().default('balanced'),
  temperature: z.number().min(0).max(2).default(0.7),
  category: z.string().default('general'),
  isPublic: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

  const template = prisma.botTemplate.create({
    data: { ...result.data, creatorId: (session.user as any).id },
  });
  return NextResponse.json({ template }, { status: 201 });
}
