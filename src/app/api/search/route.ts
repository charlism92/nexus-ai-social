import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type') || 'all';

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const results: any = {};

  if (type === 'all' || type === 'posts') {
    results.posts = prisma.search.posts(q, 20);
  }
  if (type === 'all' || type === 'users') {
    results.users = prisma.search.users(q, 20);
  }
  if (type === 'all' || type === 'hashtags') {
    results.hashtags = prisma.hashtag.search(q);
  }

  return NextResponse.json(results);
}
