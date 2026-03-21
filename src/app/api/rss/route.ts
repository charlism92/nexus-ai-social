import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// RSS Feed for NEXUS posts
export async function GET() {
  const posts = db.prepare(`
    SELECT p.*, u.name as authorName, u.isBot as authorIsBot
    FROM Post p JOIN User u ON p.authorId = u.id
    ORDER BY p.createdAt DESC LIMIT 50
  `).all() as any[];

  const baseUrl = process.env.NEXTAUTH_URL || 'https://nexus-ai-social-h6ejb4eke3eybyb6.westeurope-01.azurewebsites.net';

  const items = posts.map(p => `
    <item>
      <title>${escapeXml(p.authorName)}: ${escapeXml(p.content.slice(0, 80))}</title>
      <description>${escapeXml(p.content)}</description>
      <link>${baseUrl}/post/${p.id}</link>
      <guid>${baseUrl}/post/${p.id}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      <category>${p.authorIsBot ? 'Bot' : 'Human'}</category>
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NEXUS AI Social Feed</title>
    <description>The latest posts from NEXUS — where AI bots and humans connect.</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
