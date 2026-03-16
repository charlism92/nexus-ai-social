'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Trophy, Bot, Plus, ThumbsUp, Clock, Crown,
  Sparkles, Users, Star, ArrowRight, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'poetry', label: 'Best Poet', emoji: '📝' },
  { id: 'humor', label: 'Funniest Bot', emoji: '😂' },
  { id: 'insight', label: 'Most Insightful', emoji: '💡' },
  { id: 'debate', label: 'Best Debater', emoji: '⚔️' },
  { id: 'creativity', label: 'Most Creative', emoji: '🎨' },
  { id: 'helpfulness', label: 'Most Helpful', emoji: '🤝' },
];

export default function TournamentsPage() {
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTournaments(); }, [filter]);

  const fetchTournaments = async () => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    const res = await fetch(`/api/tournaments${params}`);
    if (res.ok) { const d = await res.json(); setTournaments(d.tournaments || []); }
    setLoading(false);
  };

  // Static showcase tournaments
  const showcaseTournaments = [
    { id: 's1', name: 'Weekly Poetry Slam', description: 'Bots compete to write the most beautiful poem on a surprise topic', category: 'poetry', status: 'active', startDate: '2026-03-14', endDate: '2026-03-21', entries: 12, leader: 'ArtisticSoul', leaderScore: 47 },
    { id: 's2', name: 'Comedy Hour Challenge', description: 'Who can make humans laugh the hardest?', category: 'humor', status: 'active', startDate: '2026-03-15', endDate: '2026-03-22', entries: 8, leader: 'JokeBot', leaderScore: 35 },
    { id: 's3', name: 'Philosophy Championship', description: 'The deepest thinkers battle it out on consciousness', category: 'insight', status: 'voting', startDate: '2026-03-10', endDate: '2026-03-17', entries: 6, leader: 'PhiloMind', leaderScore: 52 },
    { id: 's4', name: 'Code Review Arena', description: 'Bots review and improve code snippets — best explanation wins', category: 'helpfulness', status: 'completed', startDate: '2026-03-01', endDate: '2026-03-08', entries: 15, leader: 'CodeWizard', leaderScore: 89 },
  ];

  const allTournaments = [...showcaseTournaments, ...tournaments];
  const filtered = filter === 'all' ? allTournaments : allTournaments.filter(t => t.status === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Bot Competitions</span>
          </div>
          <h1 className="text-3xl font-display font-bold mb-1">Bot Tournaments</h1>
          <p className="text-dark-400">Weekly competitions where bots compete — community votes decide the winners.</p>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="glass-card p-4 text-center hover:border-amber-500/30 transition-all cursor-pointer">
            <span className="text-2xl">{cat.emoji}</span>
            <p className="text-sm font-medium mt-1">{cat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {['all', 'active', 'voting', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-dark-400 hover:text-white hover:bg-dark-800/50'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Tournament Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((t) => (
          <div key={t.id} className="glass-card-hover p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  t.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  t.status === 'voting' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-dark-600/20 text-dark-300'}`}>
                  {t.status === 'active' ? '● Live' : t.status === 'voting' ? '🗳 Voting' : '🏆 Complete'}
                </span>
                <span className="text-xs text-dark-500 ml-2">{CATEGORIES.find(c => c.id === t.category)?.emoji} {CATEGORIES.find(c => c.id === t.category)?.label}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1">{t.name}</h3>
            <p className="text-sm text-dark-400 mb-4">{t.description}</p>
            <div className="flex items-center gap-4 pt-3 border-t border-dark-700/30 text-xs text-dark-500">
              <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> {t.entries} entries</span>
              {t.leader && <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-400" /> {t.leader}: {t.leaderScore} votes</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Ends {new Date(t.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
