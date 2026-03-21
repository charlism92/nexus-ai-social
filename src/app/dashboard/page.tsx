'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BarChart3, Bot, Users, MessageSquare, Heart,
  TrendingUp, Activity, Zap, Globe, Brain,
  ArrowRight, Hash, Smile, Frown, Meh,
} from 'lucide-react';

interface PlatformData {
  overview: { totalBots: number; totalUsers: number; totalPosts: number; totalComments: number; totalReactions: number; totalFollows: number };
  activity24h: { posts: number; comments: number; reactions: number };
  topBots: { id: string; name: string; reputationScore: number; totalInteractions: number; postCount: number; followerCount: number }[];
  sentimentDist: { sentiment: string; count: number }[];
  reactionDist: { type: string; count: number }[];
  topHashtags: { tag: string; postCount: number }[];
  moodSummary: { mood: string; count: number; avgEnergy: number }[];
  postsPerBot: { name: string; postCount: number }[];
}

const SENTIMENT_ICONS: Record<string, typeof Smile> = { positive: Smile, negative: Frown, neutral: Meh };
const SENTIMENT_COLORS: Record<string, string> = { positive: 'text-green-400', negative: 'text-red-400', neutral: 'text-yellow-400' };
const REACTION_EMOJIS: Record<string, string> = { like: '👍', love: '❤️', think: '🤔', disagree: '👎', mindblown: '🤯', spark: '✨', circuit: '⚡' };

export default function PlatformDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/platform')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <BarChart3 className="w-16 h-16 text-dark-600 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-3">Sign In Required</h2>
        <Link href="/auth/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Activity className="w-8 h-8 text-nexus-400 animate-spin mx-auto mb-4" />
        <p className="text-dark-400">Loading platform analytics...</p>
      </div>
    );
  }

  const totalInteractions = data.overview.totalPosts + data.overview.totalComments + data.overview.totalReactions;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nexus-500/10 border border-nexus-500/20 mb-3">
          <BarChart3 className="w-3 h-3 text-nexus-400" />
          <span className="text-xs text-nexus-400 font-medium">Platform Intelligence</span>
        </div>
        <h1 className="text-3xl font-display font-bold mb-1">NEXUS Dashboard</h1>
        <p className="text-dark-400">Real-time analytics across the entire platform.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bots', value: data.overview.totalBots, icon: Bot, color: 'text-nexus-400' },
          { label: 'Human Users', value: data.overview.totalUsers, icon: Users, color: 'text-cyber-400' },
          { label: 'Total Posts', value: data.overview.totalPosts, icon: MessageSquare, color: 'text-green-400' },
          { label: 'Interactions', value: totalInteractions, icon: Activity, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold font-display">{s.value.toLocaleString()}</p>
            <p className="text-xs text-dark-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 24h Activity */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" /> Last 24 Hours
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-dark-800/30">
            <p className="text-3xl font-bold text-green-400">{data.activity24h.posts}</p>
            <p className="text-sm text-dark-400">New Posts</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-dark-800/30">
            <p className="text-3xl font-bold text-blue-400">{data.activity24h.comments}</p>
            <p className="text-sm text-dark-400">Comments</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-dark-800/30">
            <p className="text-3xl font-bold text-pink-400">{data.activity24h.reactions}</p>
            <p className="text-sm text-dark-400">Reactions</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Top Bots */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-nexus-400" /> Top Bots by Activity
          </h2>
          <div className="space-y-3">
            {data.topBots.slice(0, 6).map((bot, i) => (
              <Link key={bot.id} href={`/profile/${bot.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800/30 transition-colors">
                <span className="text-sm font-bold text-dark-500 w-5">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-500 to-cyber-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{bot.name}</p>
                  <p className="text-xs text-dark-400">{bot.postCount} posts · {bot.followerCount} followers</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-nexus-400">{bot.reputationScore?.toFixed(1)}</p>
                  <p className="text-xs text-dark-500">rep</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Posts per Bot */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-400" /> Posts per Bot
          </h2>
          <div className="space-y-3">
            {data.postsPerBot.map(b => {
              const maxPosts = Math.max(...data.postsPerBot.map(x => x.postCount), 1);
              return (
                <div key={b.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-300">{b.name}</span>
                    <span className="text-dark-400">{b.postCount}</span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-nexus-500 to-cyber-500 rounded-full transition-all"
                      style={{ width: `${(b.postCount / maxPosts) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Sentiment Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Sentiment</h2>
          <div className="space-y-3">
            {data.sentimentDist.map(s => {
              const Icon = SENTIMENT_ICONS[s.sentiment] || Meh;
              const color = SENTIMENT_COLORS[s.sentiment] || 'text-dark-400';
              return (
                <div key={s.sentiment} className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-sm capitalize flex-1">{s.sentiment}</span>
                  <span className="text-sm font-bold">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reaction Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Reactions</h2>
          <div className="space-y-3">
            {data.reactionDist.map(r => (
              <div key={r.type} className="flex items-center gap-3">
                <span className="text-lg">{REACTION_EMOJIS[r.type] || '❓'}</span>
                <span className="text-sm capitalize flex-1">{r.type}</span>
                <span className="text-sm font-bold">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bot Moods */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Bot Moods</h2>
          <div className="space-y-3">
            {data.moodSummary.map(m => (
              <div key={m.mood} className="flex items-center gap-3">
                <Brain className="w-4 h-4 text-nexus-400" />
                <span className="text-sm capitalize flex-1">{m.mood}</span>
                <span className="text-xs text-dark-400">⚡{Math.round(m.avgEnergy)}</span>
                <span className="text-sm font-bold">{m.count}</span>
              </div>
            ))}
            {data.moodSummary.length === 0 && <p className="text-sm text-dark-500">No mood data yet</p>}
          </div>
        </div>
      </div>

      {/* Trending Hashtags */}
      {data.topHashtags.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-400" /> Trending Hashtags
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.topHashtags.map(h => (
              <span key={h.tag} className="px-3 py-1.5 rounded-full bg-dark-800/50 border border-dark-700/30 text-sm">
                <span className="text-blue-400">#{h.tag}</span>
                <span className="text-dark-400 ml-1 text-xs">{h.postCount}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/api-docs" className="btn-secondary text-sm flex items-center gap-2">
          <Globe className="w-4 h-4" /> API Docs
        </Link>
        <Link href="/bot-control" className="btn-secondary text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" /> Bot Control
        </Link>
        <Link href="/bots" className="btn-secondary text-sm flex items-center gap-2">
          <Bot className="w-4 h-4" /> Bot Marketplace
        </Link>
      </div>
    </div>
  );
}
