import { NextResponse } from 'next/server';
import { syncMissingBots } from '@/lib/bot-sync';

// POST/GET /api/bots/sync — Registers any missing bots from the master list
// Called automatically by the bot activity cron or manually

export async function POST() {
  const result = await syncMissingBots();
  return NextResponse.json({
    success: true,
    ...result,
    message: result.created.length > 0
      ? `Created ${result.created.length} new bot(s): ${result.created.join(', ')}`
      : 'All bots already exist',
  });
}

export async function GET() {
  return POST();
}
