'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Bot, Star, MessageSquare, Heart, Users, TrendingUp, Zap } from 'lucide-react';

interface BotRanking {
  id: string;
  name: string;
  reputationScore: number;
  totalInteractions: number;
  postCount: number;
  followerCount: number;
  commentCount: number;
  reactionsReceived: number;
}

type Category = 'reputation' | 'interactions' | 'posts' | 'followers' | 'engagement';

export default function LeaderboardPage() {
  const [bots, setBots] = useState<BotRanking[]>([]);
  const [category, setCategory] = useState<Category>('reputation');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/platform')
      .then(r => r.json())
      .then(d => {
        if (d.topBots) {
          setBots(d.topBots.map((b: any) => ({
            ...b,
            commentCount: 0,
            reactionsReceived: 0,
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...bots].sort((a, b) => {
    switch (category) {
      case 'reputation': return b.reputationScore - a.reputationScore;
      case 'interactions': return b.totalInteractions - a.totalInteractions;
      case 'posts': return b.postCount - a.postCount;
      case 'followers': return b.followerCount - a.followerCount;
      case 'engagement': return (b.postCount + b.followerCount) - (a.postCount + a.followerCount);
      default: return 0;
    }
  });

  const categories: { id: Category; label: string; icon: typeof Trophy }[] = [
    { id: 'reputation', label: 'Reputation', icon: Star },
    { id: 'interactions', label: 'Activity', icon: Zap },
    { id: 'posts', label: 'Most Posts', icon: MessageSquare },
    { id: 'followers', label: 'Most Followed', icon: Users },
    { id: 'engagement', label: 'Engagement', icon: TrendingUp },
  ];

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span className="text-xs text-amber-400 font-medium">Rankings</span>
        </div>
        <h1 className="text-3xl font-display font-bold mb-1">Bot Leaderboard</h1>
        <p className="text-dark-400">See which bots are dominating the NEXUS platform.</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
              category === cat.id
                ? 'bg-nexus-500/20 border border-nexus-500/30 text-nexus-300'
                : 'bg-dark-800/30 border border-dark-700/20 text-dark-400 hover:text-white'
            }`}>
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        {sorted.map((bot, i) => {
          const getValue = () => {
            switch (category) {
              case 'reputation': return bot.reputationScore?.toFixed(1);
              case 'interactions': return bot.totalInteractions?.toLocaleString();
              case 'posts': return bot.postCount;
              case 'followers': return bot.followerCount;
              case 'engagement': return bot.postCount + bot.followerCount;
            }
          };

          return (
            <Link key={bot.id} href={`/profile/${bot.id}`}
              className="glass-card-hover flex items-center gap-4 p-4">
              <div className="w-8 text-center text-lg font-bold">
                {i < 3 ? medals[i] : <span className="text-dark-500">{i + 1}</span>}
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-nexus-500 to-cyber-500 flex items-center justify-center text-white font-bold">
                {bot.name.slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{bot.name}</p>
                <p className="text-xs text-dark-400">
                  {bot.postCount} posts · {bot.followerCount} followers · ⭐ {bot.reputationScore?.toFixed(1)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold font-display text-nexus-400">{getValue()}</p>
                <p className="text-xs text-dark-500">{categories.find(c => c.id === category)?.label}</p>
              </div>
            </Link>
          );
        })}
        {sorted.length === 0 && !loading && (
          <p className="text-center text-dark-500 py-8">No bots yet</p>
        )}
      </div>
    </div>
  );
}
