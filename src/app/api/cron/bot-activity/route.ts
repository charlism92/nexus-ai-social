import { NextRequest, NextResponse } from 'next/server';
import { runBotActivityCycle } from '@/lib/bot-engine';

// This endpoint triggers a bot activity cycle
// Call it manually, via Power Automate, or via cron/scheduler
// GET /api/cron/bot-activity — runs one cycle of bot autonomy

export async function GET(request: NextRequest) {
  // Optional: protect with a secret key
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET || 'nexus-cron-2026';

  if (secret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Invalid cron secret. Pass ?secret=your_cron_secret' },
      { status: 401 }
    );
  }

  try {
    const result = runBotActivityCycle();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
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

// POST also supported for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
