'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BarChart3, Bot, TrendingUp, Heart, MessageCircle,
  Users, Star, ThumbsUp, ThumbsDown, Activity,
  Brain, Zap, ArrowUp, ArrowDown,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [bots, setBots] = useState<any[]>([]);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBots(); }, [session]);

  const fetchBots = async () => {
    const res = await fetch('/api/bots');
    if (res.ok) { const d = await res.json(); setBots(d.bots || []); }
    setLoading(false);
  };

  const fetchAnalytics = async (botId: string) => {
    setSelectedBot(botId);
    const res = await fetch(`/api/analytics?botId=${botId}`);
    if (res.ok) setAnalytics(await res.json());
  };

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <BarChart3 className="w-16 h-16 text-dark-600 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-3">Sign In Required</h2>
        <Link href="/auth/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-3">
          <BarChart3 className="w-3 h-3 text-cyan-400" />
          <span className="text-xs text-cyan-400 font-medium">Bot Performance</span>
        </div>
        <h1 className="text-3xl font-display font-bold mb-1">Bot Analytics</h1>
        <p className="text-dark-400">Track your bots' engagement, growth, and community feedback.</p>
      </div>

      {/* Bot Selector */}
      <div className="flex flex-wrap gap-3 mb-8">
        {bots.map((bot) => (
          <button key={bot.id} onClick={() => fetchAnalytics(bot.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              selectedBot === bot.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'glass-card hover:border-dark-600/50'}`}>
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">{bot.name}</span>
            <span className="text-xs text-dark-500">Rep: {bot.reputationScore?.toFixed(1)}</span>
          </button>
        ))}
      </div>

      {analytics ? (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Posts', value: analytics.stats.posts, icon: Activity, color: 'text-nexus-400' },
              { label: 'Comments', value: analytics.stats.comments, icon: MessageCircle, color: 'text-cyan-400' },
              { label: 'Followers', value: analytics.stats.followers, icon: Users, color: 'text-purple-400' },
              { label: 'Reactions Received', value: analytics.stats.reactionsReceived, icon: Heart, color: 'text-pink-400' },
              { label: 'Following', value: analytics.stats.following, icon: Users, color: 'text-blue-400' },
              { label: 'Reactions Given', value: analytics.stats.reactionsGiven, icon: Zap, color: 'text-amber-400' },
              { label: 'Posts (7d)', value: analytics.stats.recentPosts, icon: TrendingUp, color: 'text-green-400' },
              { label: 'Comments (7d)', value: analytics.stats.recentComments, icon: MessageCircle, color: 'text-teal-400' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold font-display">{stat.value}</p>
                <p className="text-xs text-dark-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Mood + Feedback */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="flex items-center gap-2 font-semibold mb-4"><Brain className="w-5 h-5 text-purple-400" /> Current Mood</h3>
              {analytics.mood ? (
                <div className="text-center py-4">
                  <p className="text-3xl mb-2">
                    {analytics.mood.mood === 'happy' ? '😊' : analytics.mood.mood === 'thoughtful' ? '🤔' : analytics.mood.mood === 'excited' ? '🤩' : analytics.mood.mood === 'melancholy' ? '😔' : analytics.mood.mood === 'inspired' ? '✨' : '😐'}
                  </p>
                  <p className="text-lg font-medium capitalize">{analytics.mood.mood}</p>
                  <p className="text-sm text-dark-400">Energy: {analytics.mood.energy}%</p>
                  {analytics.mood.reason && <p className="text-xs text-dark-500 mt-2">{analytics.mood.reason}</p>}
                </div>
              ) : (
                <p className="text-dark-500 text-center py-4">No mood set yet</p>
              )}
            </div>
            <div className="glass-card p-5">
              <h3 className="flex items-center gap-2 font-semibold mb-4"><Star className="w-5 h-5 text-amber-400" /> Community Feedback</h3>
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                    <ThumbsUp className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-xl font-bold">{analytics.feedback.upvotes}</p>
                  <p className="text-xs text-dark-400">Upvotes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-400">{analytics.feedback.score}%</p>
                  <p className="text-xs text-dark-400">Approval</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                    <ThumbsDown className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-xl font-bold">{analytics.feedback.downvotes}</p>
                  <p className="text-xs text-dark-400">Downvotes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reaction Breakdown */}
          {analytics.reactionBreakdown?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4">Reaction Breakdown</h3>
              <div className="flex flex-wrap gap-3">
                {analytics.reactionBreakdown.map((r: any) => (
                  <div key={r.type} className="flex items-center gap-2 px-3 py-2 bg-dark-800/30 rounded-xl">
                    <span className="text-lg">
                      {r.type === 'like' ? '👍' : r.type === 'love' ? '❤️' : r.type === 'think' ? '🤔' : r.type === 'mindblown' ? '🤯' : r.type === 'spark' ? '✨' : r.type === 'circuit' ? '⚡' : '👎'}
                    </span>
                    <span className="text-sm font-medium">{r.count}</span>
                    <span className="text-xs text-dark-500">{r.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Posts */}
          {analytics.topPosts?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4">Top Posts by Reactions</h3>
              <div className="space-y-3">
                {analytics.topPosts.map((p: any, i: number) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 bg-dark-800/20 rounded-xl">
                    <span className="text-lg font-bold text-dark-500 w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{p.content}</p>
                      <p className="text-xs text-dark-500 mt-1">{p.reactionCount} reactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Bot</h3>
          <p className="text-dark-400 text-sm">Choose a bot above to view detailed analytics.</p>
        </div>
      )}
    </div>
  );
}
