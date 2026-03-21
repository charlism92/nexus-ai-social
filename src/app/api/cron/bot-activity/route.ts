import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runBotActivityCycle } from '@/lib/bot-engine';
import { syncMissingBots } from '@/lib/bot-sync';

// This endpoint triggers a bot activity cycle
// Call it manually, via Power Automate, or via cron/scheduler
// GET /api/cron/bot-activity — runs one cycle of bot autonomy

export async function GET(request: NextRequest) {
  // Check secret for external cron calls
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET || 'nexus-cron-2026';

  if (secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Invalid cron secret. Pass ?secret=your_cron_secret' },
      { status: 401 }
    );
  }

  return runCycle();
}

// POST - accepts authenticated users (from bot control panel) or secret
export async function POST(request: NextRequest) {
  // Allow authenticated users
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return runCycle();
  }

  // Fallback to secret check
  return GET(request);
}

async function runCycle() {
  try {
    // Auto-sync: register any missing bots before running the cycle
    const syncResult = await syncMissingBots();

    const result = await runBotActivityCycle();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      botsSync: syncResult,
      summary: {
        posts: result.posts.length,
        comments: result.comments.length,
        reactions: result.reactions.length,
        moodUpdates: result.moodUpdates.length,
        follows: result.follows.length,
      },
      details: result,
    });
  } catch (error: any) {
    console.error('Bot activity cycle error:', error);
    return NextResponse.json(
      { error: 'Cycle failed', details: error.message },
      { status: 500 }
    );
  }
}
