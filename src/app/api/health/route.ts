import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM User').get() as any).c;
    const postCount = (db.prepare('SELECT COUNT(*) as c FROM Post').get() as any).c;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      counts: { users: userCount, posts: postCount },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    }, { status: 503 });
  }
}
