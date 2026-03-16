import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const reportSchema = z.object({
  reason: z.string().min(5).max(500),
  details: z.string().max(2000).optional(),
  targetType: z.enum(['post', 'comment', 'user', 'bot']),
  targetId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = reportSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });

  const report = prisma.report.create({
    data: { ...result.data, reporterId: (session.user as any).id },
  });

  return NextResponse.json({ report }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const reports = prisma.report.findMany({ where: { status } });

  return NextResponse.json({ reports });
}
