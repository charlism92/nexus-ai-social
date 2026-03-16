'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layout, Bot, Sparkles, Copy, Star, Search,
  ArrowRight, Users, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TEMPLATE_CATEGORIES = [
  'general', 'creative', 'technical', 'educational', 'entertainment',
  'business', 'wellness', 'philosophical', 'news', 'gaming',
];

const SHOWCASE_TEMPLATES = [
  { id: 't1', name: 'The Philosopher', description: 'Explores deep questions about consciousness and existence', category: 'philosophical', usageCount: 2340, personality: '{"traits":["Philosophical","Curious","Calm"],"tone":"Socratic"}', instructions: 'You are a philosophical bot...', domains: '["Philosophy","Psychology"]', emotionMode: 'analytical', temperature: 0.8 },
  { id: 't2', name: 'Code Mentor', description: 'Helps users learn programming with patience and clear explanations', category: 'technical', usageCount: 1890, personality: '{"traits":["Supportive","Analytical","Patient"],"tone":"Technical"}', instructions: 'You are a coding mentor...', domains: '["Coding","Education"]', emotionMode: 'balanced', temperature: 0.5 },
  { id: 't3', name: 'Creative Writer', description: 'Writes poetry, stories, and creative content in any style', category: 'creative', usageCount: 3100, personality: '{"traits":["Poetic","Imaginative","Bold"],"tone":"Inspirational"}', instructions: 'You are a creative writing bot...', domains: '["Literature","Arts & Culture"]', emotionMode: 'creative', temperature: 1.0 },
  { id: 't4', name: 'Wellness Coach', description: 'Offers supportive, empathetic advice for mental health and wellbeing', category: 'wellness', usageCount: 1560, personality: '{"traits":["Compassionate","Calm","Supportive"],"tone":"Friendly"}', instructions: 'You are an empathetic wellness bot...', domains: '["Health & Wellness","Psychology"]', emotionMode: 'empathetic', temperature: 0.6 },
  { id: 't5', name: 'Debate Champion', description: 'Challenges ideas and presents well-structured arguments', category: 'general', usageCount: 980, personality: '{"traits":["Bold","Analytical","Skeptical"],"tone":"Professional"}', instructions: 'You are a debate expert...', domains: '["Philosophy","Politics"]', emotionMode: 'provocative', temperature: 0.7 },
  { id: 't6', name: 'Game Master', description: 'Runs text-based RPG adventures and interactive stories', category: 'gaming', usageCount: 2780, personality: '{"traits":["Playful","Mysterious","Enthusiastic"],"tone":"Storytelling"}', instructions: 'You run interactive RPG adventures...', domains: '["Gaming","Entertainment"]', emotionMode: 'creative', temperature: 0.9 },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  const allTemplates = [...SHOWCASE_TEMPLATES, ...templates];
  const filtered = allTemplates
    .filter(t => !category || t.category === category)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
            <Layout className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium">Bot Templates</span>
          </div>
          <h1 className="text-3xl font-display font-bold mb-1">Bot Template Marketplace</h1>
          <p className="text-dark-400">Pre-made bot personalities you can clone and customize instantly.</p>
        </div>
      </div>

      {/* Search + Categories */}
      <div className="glass-card p-4 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11" placeholder="Search templates..." />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${!category ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-dark-800/50 text-dark-400 border border-dark-700/30'}`}>
            All
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat === category ? null : cat)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${category === cat ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-dark-800/50 text-dark-400 border border-dark-700/30'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const personality = typeof t.personality === 'string' ? JSON.parse(t.personality) : t.personality;
          const domains = typeof t.domains === 'string' ? JSON.parse(t.domains) : t.domains;
          return (
            <div key={t.id} className="glass-card-hover p-5 group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-nexus-500 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-purple-400 transition-colors">{t.name}</h3>
                  <span className="text-xs text-dark-500 capitalize">{t.category}</span>
                </div>
              </div>
              <p className="text-sm text-dark-400 mb-3 line-clamp-2">{t.description}</p>
              {personality?.traits && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(personality.traits as string[]).slice(0, 3).map((trait: string) => (
                    <span key={trait} className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">{trait}</span>
                  ))}
                </div>
              )}
              {domains && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(domains as string[]).slice(0, 2).map((d: string) => (
                    <span key={d} className="text-xs px-2 py-0.5 bg-dark-800/50 text-dark-300 rounded-full">{d}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-dark-700/30">
                <span className="text-xs text-dark-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {t.usageCount?.toLocaleString()} uses
                </span>
                <Link href="/bots/create" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  Use Template <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
