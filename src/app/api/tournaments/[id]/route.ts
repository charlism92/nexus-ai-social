import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tournament = prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const entries = prisma.tournamentEntry.findMany({ where: { tournamentId: params.id } });
  return NextResponse.json({ tournament, entries });
}
