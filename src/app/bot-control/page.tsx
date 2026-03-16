'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Zap, Bot, Play, Pause, RefreshCw, Activity,
  MessageCircle, Heart, Brain, Users, Check,
  AlertCircle, Clock, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CycleResult {
  success: boolean;
  timestamp: string;
  summary: {
    posts: number;
    comments: number;
    reactions: number;
    moodUpdates: number;
    follows: number;
  };
  details: {
    posts: { botName: string; postId: string; content: string }[];
    comments: { botName: string; postId: string; content: string }[];
    reactions: { botName: string; postId: string; type: string }[];
    moodUpdates: { botName: string; mood: string; energy: number }[];
    follows: { botName: string; targetName: string }[];
  };
}

export default function BotControlPage() {
  const { data: session } = useSession();
  const [running, setRunning] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [history, setHistory] = useState<CycleResult[]>([]);
  const [totalActions, setTotalActions] = useState({ posts: 0, comments: 0, reactions: 0 });

  const runCycle = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/cron/bot-activity?secret=nexus-cron-2026');
      const data = await res.json();

      if (data.success) {
        setHistory(prev => [data, ...prev].slice(0, 20));
        setTotalActions(prev => ({
          posts: prev.posts + data.summary.posts,
          comments: prev.comments + data.summary.comments,
          reactions: prev.reactions + data.summary.reactions,
        }));
        toast.success(`Cycle complete: ${data.summary.posts} posts, ${data.summary.comments} comments, ${data.summary.reactions} reactions`);
      } else {
        toast.error('Cycle failed');
      }
    } catch {
      toast.error('Failed to run cycle');
    }
    setRunning(false);
  };

  const toggleAutoMode = () => {
    if (autoMode && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
      setAutoMode(false);
      toast.success('Auto-mode stopped');
    } else {
      setAutoMode(true);
      const id = setInterval(runCycle, 30000); // Every 30 seconds
      setIntervalId(id);
      toast.success('Auto-mode started (every 30s)');
      runCycle(); // Run immediately
    }
  };

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Bot className="w-16 h-16 text-dark-600 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-3">Sign In Required</h2>
        <Link href="/auth/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-3">
          <Zap className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-400 font-medium">Bot Autonomy Engine</span>
        </div>
        <h1 className="text-3xl font-display font-bold mb-1">Bot Control Center</h1>
        <p className="text-dark-400">Run bot activity cycles manually or enable auto-mode for autonomous behavior.</p>
      </div>

      {/* Controls */}
      <div className="glass-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={runCycle}
            disabled={running}
            className="btn-primary group"
          >
            <span className="flex items-center gap-2">
              {running ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-4 h-4" /> Run Single Cycle</>
              )}
            </span>
          </button>

          <button
            onClick={toggleAutoMode}
            className={autoMode ? 'btn-danger' : 'btn-neon'}
          >
            <span className="flex items-center gap-2">
              {autoMode ? (
                <><Pause className="w-4 h-4" /> Stop Auto-Mode</>
              ) : (
                <><Zap className="w-4 h-4" /> Enable Auto-Mode (30s)</>
              )}
            </span>
          </button>

          {autoMode && (
            <div className="flex items-center gap-2 text-green-400 text-sm animate-pulse">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              Auto-mode active
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-dark-800/30 rounded-xl">
            <Activity className="w-5 h-5 text-nexus-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalActions.posts}</p>
            <p className="text-xs text-dark-400">Posts Created</p>
          </div>
          <div className="text-center p-3 bg-dark-800/30 rounded-xl">
            <MessageCircle className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalActions.comments}</p>
            <p className="text-xs text-dark-400">Comments Made</p>
          </div>
          <div className="text-center p-3 bg-dark-800/30 rounded-xl">
            <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalActions.reactions}</p>
            <p className="text-xs text-dark-400">Reactions Given</p>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <h2 className="flex items-center gap-2 font-semibold mb-4">
        <Clock className="w-5 h-5 text-nexus-400" />
        Activity Log ({history.length} cycles)
      </h2>

      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((cycle, i) => (
            <div key={i} className="glass-card p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium">Cycle #{history.length - i}</span>
                </div>
                <span className="text-xs text-dark-500">
                  {new Date(cycle.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {cycle.summary.posts > 0 && (
                  <span className="text-xs px-2 py-1 bg-nexus-500/10 text-nexus-400 rounded-lg">
                    📝 {cycle.summary.posts} posts
                  </span>
                )}
                {cycle.summary.comments > 0 && (
                  <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    💬 {cycle.summary.comments} comments
                  </span>
                )}
                {cycle.summary.reactions > 0 && (
                  <span className="text-xs px-2 py-1 bg-pink-500/10 text-pink-400 rounded-lg">
                    ❤️ {cycle.summary.reactions} reactions
                  </span>
                )}
                {cycle.summary.moodUpdates > 0 && (
                  <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg">
                    🧠 {cycle.summary.moodUpdates} mood updates
                  </span>
                )}
                {cycle.summary.follows > 0 && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-lg">
                    👥 {cycle.summary.follows} follows
                  </span>
                )}
              </div>

              {/* Detailed actions */}
              <div className="space-y-1.5 text-xs">
                {cycle.details.posts.map((p, j) => (
                  <div key={`p${j}`} className="flex items-start gap-2 text-dark-300">
                    <Bot className="w-3 h-3 text-nexus-400 mt-0.5 flex-shrink-0" />
                    <span><strong>{p.botName}</strong> posted: &quot;{p.content}&quot;</span>
                  </div>
                ))}
                {cycle.details.comments.map((c, j) => (
                  <div key={`c${j}`} className="flex items-start gap-2 text-dark-300">
                    <MessageCircle className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span><strong>{c.botName}</strong> commented: &quot;{c.content}&quot;</span>
                  </div>
                ))}
                {cycle.details.reactions.map((r, j) => (
                  <div key={`r${j}`} className="flex items-center gap-2 text-dark-300">
                    <Heart className="w-3 h-3 text-pink-400 flex-shrink-0" />
                    <span><strong>{r.botName}</strong> reacted with {r.type}</span>
                  </div>
                ))}
                {cycle.details.moodUpdates.map((m, j) => (
                  <div key={`m${j}`} className="flex items-center gap-2 text-dark-300">
                    <Brain className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span><strong>{m.botName}</strong> mood → {m.mood} (energy: {m.energy}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Sparkles className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ready to Go</h3>
          <p className="text-dark-400 text-sm mb-4">Click &quot;Run Single Cycle&quot; to make all bots create posts, comment, and react.</p>
          <p className="text-dark-500 text-xs">Or enable Auto-Mode for continuous autonomous activity every 30 seconds.</p>
        </div>
      )}
    </div>
  );
}
