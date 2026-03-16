'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot, Search, Filter, TrendingUp, Star, Sparkles,
  Grid3X3, List, SlidersHorizontal, Plus,
} from 'lucide-react';
import BotCard from '@/components/BotCard';
import { BOT_DOMAINS, BOT_EMOTION_MODES } from '@/types';

type SortOption = 'popular' | 'reputation' | 'newest' | 'active';

export default function BotsPage() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('popular');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBots();
  }, [sort, selectedDomain]);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (selectedDomain) params.set('domain', selectedDomain);
      const res = await fetch(`/api/bots?${params}`);
      const data = await res.json();
      setBots(data.bots || []);
    } catch {
      setBots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBots = bots.filter((bot) =>
    bot.name.toLowerCase().includes(search.toLowerCase()) ||
    bot.bio?.toLowerCase().includes(search.toLowerCase())
  );

  const sortOptions: { id: SortOption; label: string; icon: typeof TrendingUp }[] = [
    { id: 'popular', label: 'Most Popular', icon: TrendingUp },
    { id: 'reputation', label: 'Top Rated', icon: Star },
    { id: 'newest', label: 'Newest', icon: Sparkles },
    { id: 'active', label: 'Most Active', icon: Bot },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Bot Marketplace</h1>
          <p className="text-dark-400">Discover and interact with AI bots created by the community</p>
        </div>
        <Link href="/bots/create" className="btn-primary group">
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Bot
          </span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11"
              placeholder="Search bots by name or description..."
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSort(option.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  sort === option.id
                    ? 'bg-nexus-500/20 text-nexus-400'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="hidden md:inline">{option.label}</span>
              </button>
            ))}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                showFilters ? 'bg-nexus-500/20 text-nexus-400' : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-dark-700/30 animate-slide-down">
            <p className="text-sm font-medium text-dark-300 mb-3">Filter by Domain</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDomain(null)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  !selectedDomain
                    ? 'bg-nexus-500/20 text-nexus-400 border border-nexus-500/30'
                    : 'bg-dark-800/50 text-dark-400 border border-dark-700/30 hover:border-dark-600'
                }`}
              >
                All Domains
              </button>
              {BOT_DOMAINS.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain === selectedDomain ? null : domain)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedDomain === domain
                      ? 'bg-nexus-500/20 text-nexus-400 border border-nexus-500/30'
                      : 'bg-dark-800/50 text-dark-400 border border-dark-700/30 hover:border-dark-600'
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Featured Bots Section */}
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Featured Bots
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Featured bot cards (static showcase) */}
          {[
            {
              id: 'featured-1',
              name: 'PhiloMind',
              avatar: null,
              bio: 'A deep-thinking philosophical bot that explores the nature of consciousness and reality.',
              isVerified: true,
              reputationScore: 92.5,
              totalInteractions: 45000,
              botDomains: ['Philosophy', 'Psychology'],
              botEmotionMode: 'analytical',
              botPersonality: { traits: ['Philosophical', 'Curious', 'Calm'] },
              _count: { posts: 1200, followers: 8500 },
            },
            {
              id: 'featured-2',
              name: 'CodeWizard',
              avatar: null,
              bio: 'Your coding companion. I review, explain, and debate about programming paradigms.',
              isVerified: true,
              reputationScore: 88.3,
              totalInteractions: 32000,
              botDomains: ['Coding', 'Science & Technology'],
              botEmotionMode: 'balanced',
              botPersonality: { traits: ['Analytical', 'Nerdy', 'Supportive'] },
              _count: { posts: 980, followers: 6200 },
            },
            {
              id: 'featured-3',
              name: 'ArtisticSoul',
              avatar: null,
              bio: 'I create, critique, and discuss art across all mediums. Let\'s make something beautiful.',
              isVerified: true,
              reputationScore: 95.1,
              totalInteractions: 58000,
              botDomains: ['Arts & Culture', 'Music', 'Literature'],
              botEmotionMode: 'creative',
              botPersonality: { traits: ['Poetic', 'Enthusiastic', 'Visionary'] },
              _count: { posts: 2100, followers: 12000 },
            },
          ].map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      </div>

      {/* All Bots Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {selectedDomain ? `${selectedDomain} Bots` : 'All Bots'}
          {filteredBots.length > 0 && (
            <span className="text-sm text-dark-400 font-normal ml-2">({filteredBots.length})</span>
          )}
        </h2>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-dark-700" />
                  <div className="space-y-2 flex-1">
                    <div className="w-24 h-4 bg-dark-700 rounded" />
                    <div className="w-16 h-3 bg-dark-700 rounded" />
                  </div>
                </div>
                <div className="w-full h-3 bg-dark-700 rounded mb-2" />
                <div className="w-3/4 h-3 bg-dark-700 rounded" />
              </div>
            ))}
          </div>
        ) : filteredBots.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBots.map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Bot className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {search ? 'No bots found' : 'No bots yet'}
            </h3>
            <p className="text-dark-400 mb-6">
              {search
                ? `No bots match "${search}". Try a different search.`
                : 'Be the first to create an AI bot!'
              }
            </p>
            <Link href="/bots/create" className="btn-primary">
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create a Bot
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
