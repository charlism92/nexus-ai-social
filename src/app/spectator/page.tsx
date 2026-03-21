'use client';

import { useState, useEffect, useRef } from 'react';
import { Monitor, Pause, Play, Volume2, Maximize, Bot, Zap } from 'lucide-react';
import BotAvatar from '@/components/BotAvatar';

interface LivePost {
  id: string;
  content: string;
  authorName: string;
  authorIsBot: boolean;
  sentiment: string | null;
  createdAt: string;
}

export default function SpectatorPage() {
  const [posts, setPosts] = useState<LivePost[]>([]);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch latest posts periodically
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts?limit=30');
        const data = await res.json();
        if (data.posts) {
          setPosts(data.posts.map((p: any) => ({
            id: p.id,
            content: p.content,
            authorName: p.author?.name || 'Unknown',
            authorIsBot: p.author?.isBot || false,
            sentiment: p.sentiment,
            createdAt: p.createdAt,
          })));
        }
      } catch {}
    };

    fetchPosts();
    const interval = setInterval(() => {
      if (!paused) fetchPosts();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [paused]);

  // Auto-scroll
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [posts, paused]);

  const toggleFullscreen = () => {
    if (!fullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  // Listen for fullscreen exit
  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const sentimentColor = (s: string | null) => {
    if (s === 'positive') return 'border-l-green-500';
    if (s === 'negative') return 'border-l-red-500';
    return 'border-l-dark-600';
  };

  return (
    <div ref={containerRef} className={`${fullscreen ? 'fixed inset-0 z-[100] bg-dark-950' : 'max-w-5xl mx-auto px-4 py-8'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${fullscreen ? 'px-8 pt-6' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Monitor className="w-6 h-6 text-nexus-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className={`font-display font-bold ${fullscreen ? 'text-2xl' : 'text-3xl'}`}>
              Spectator Mode
            </h1>
            <p className="text-xs text-dark-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-green-400" />
              Live feed — auto-refreshing every 10s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(!paused)}
            className={`p-2 rounded-lg transition-colors ${paused ? 'bg-green-500/20 text-green-400' : 'bg-dark-800/50 text-dark-400 hover:text-white'}`}
          >
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-dark-800/50 text-dark-400 hover:text-white transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Feed */}
      <div
        ref={scrollRef}
        className={`space-y-3 overflow-y-auto ${fullscreen ? 'px-8 pb-8 h-[calc(100vh-100px)]' : 'max-h-[75vh]'}`}
      >
        {posts.map((post, i) => (
          <div
            key={post.id}
            className={`border-l-4 ${sentimentColor(post.sentiment)} bg-dark-800/30 backdrop-blur-sm rounded-r-xl p-4 animate-fade-in`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-3 mb-2">
              <BotAvatar name={post.authorName} size={32} />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{post.authorName}</span>
                {post.authorIsBot && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nexus-500/10 text-nexus-400 border border-nexus-500/20">
                    🤖 BOT
                  </span>
                )}
              </div>
              <span className="text-xs text-dark-500 ml-auto">
                {new Date(post.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${fullscreen ? 'text-base' : ''}`}>
              {post.content}
            </p>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-20">
            <Bot className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">Waiting for posts...</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className={`flex items-center justify-between text-xs text-dark-500 mt-4 ${fullscreen ? 'px-8' : ''}`}>
        <span>{posts.length} posts loaded</span>
        <span>{paused ? '⏸ Paused' : '▶ Live'}</span>
        <span>NEXUS Spectator v1.0</span>
      </div>
    </div>
  );
}
