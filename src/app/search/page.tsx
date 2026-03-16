'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search as SearchIcon, Bot, FileText, Hash,
  User, ArrowRight, Sparkles, X,
} from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const doSearch = async (q?: string) => {
    const searchQuery = q || query;
    if (searchQuery.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`);
      if (res.ok) setResults(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-6">Search</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          className="input-field pl-12 pr-12 !py-4 text-lg" placeholder="Search posts, users, hashtags..." autoFocus />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'posts', 'users', 'hashtags'].map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (query) doSearch(); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-nexus-500/20 text-nexus-400 border border-nexus-500/30' : 'text-dark-400 hover:text-white hover:bg-dark-800/50'}`}>
            {tab}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8"><div className="w-6 h-6 border-2 border-nexus-500/30 border-t-nexus-500 rounded-full animate-spin mx-auto" /></div>}

      {results && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Posts */}
          {results.posts?.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-dark-300 mb-3"><FileText className="w-4 h-4" /> Posts ({results.posts.length})</h2>
              <div className="space-y-3">
                {results.posts.slice(0, 10).map((p: any) => (
                  <Link key={p.id} href={`/post/${p.id}`} className="block glass-card-hover p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{p.authorName}</span>
                      {p.authorIsBot && <span className="badge-bot text-[10px]">🤖</span>}
                    </div>
                    <p className="text-sm text-dark-300 line-clamp-2">{p.content}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {results.users?.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-dark-300 mb-3"><User className="w-4 h-4" /> Users ({results.users.length})</h2>
              <div className="space-y-2">
                {results.users.map((u: any) => (
                  <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 glass-card-hover p-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${u.isBot ? 'bg-gradient-to-br from-cyber-400 to-nexus-500' : 'bg-gradient-to-br from-nexus-500 to-purple-500'}`}>
                      {u.isBot ? <Bot className="w-5 h-5 text-white" /> : u.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium text-sm">{u.name}</span>
                      {u.isBot && <span className="badge-bot text-[10px] ml-2">🤖</span>}
                      {u.bio && <p className="text-xs text-dark-400 line-clamp-1">{u.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {results.hashtags?.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-dark-300 mb-3"><Hash className="w-4 h-4" /> Hashtags ({results.hashtags.length})</h2>
              <div className="flex flex-wrap gap-2">
                {results.hashtags.map((h: any) => (
                  <span key={h.id} className="px-3 py-1.5 bg-nexus-500/10 text-nexus-400 rounded-xl text-sm border border-nexus-500/20 cursor-pointer hover:bg-nexus-500/20 transition-all">
                    #{h.tag} <span className="text-dark-500 ml-1">{h.postCount}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!results.posts?.length && !results.users?.length && !results.hashtags?.length && (
            <div className="text-center py-12">
              <SearchIcon className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">No results found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!results && !loading && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Type at least 2 characters and press Enter to search</p>
        </div>
      )}
    </div>
  );
}
