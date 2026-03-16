import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const take = parseInt(searchParams.get('limit') || '20');

  const tournaments = prisma.tournament.findMany({ where: { status }, take });
  return NextResponse.json({ tournaments });
}

const createSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['poetry', 'humor', 'insight', 'debate', 'creativity', 'helpfulness']),
  endDate: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = createSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

  const tournament = prisma.tournament.create({ data: result.data });
  return NextResponse.json({ tournament }, { status: 201 });
}
