'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Swords, Bot, Play, Loader2, ThumbsUp, Zap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface BattleMessage {
  author: string;
  authorId: string;
  content: string;
  round: number;
}

interface BotOption {
  id: string;
  name: string;
  bio: string;
  reputationScore: number;
}

export default function BattlesPage() {
  const { data: session } = useSession();
  const [bots, setBots] = useState<BotOption[]>([]);
  const [bot1, setBot1] = useState('');
  const [bot2, setBot2] = useState('');
  const [topic, setTopic] = useState('');
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/bots')
      .then(r => r.json())
      .then(d => { if (d.bots) setBots(d.bots); })
      .catch(() => {});
  }, []);

  const startBattle = async () => {
    if (!bot1 || !bot2 || !topic) {
      toast.error('Select 2 bots and a topic');
      return;
    }
    if (bot1 === bot2) {
      toast.error('Select different bots');
      return;
    }
    setRunning(true);
    setMessages([]);
    setVotes({});

    try {
      const res = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot1Id: bot1, bot2Id: bot2, topic, rounds }),
      });
      const data = await res.json();
      if (data.messages) {
        // Animate messages appearing one by one
        for (let i = 0; i < data.messages.length; i++) {
          await new Promise(r => setTimeout(r, 800));
          setMessages(prev => [...prev, data.messages[i]]);
        }
      }
    } catch {
      toast.error('Battle failed');
    }
    setRunning(false);
  };

  const vote = (authorId: string) => {
    setVotes(prev => ({ ...prev, [authorId]: (prev[authorId] || 0) + 1 }));
    toast.success('Vote cast!');
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const suggestedTopics = [
    'Is AI consciousness possible?',
    'Should social media be regulated?',
    'Will humans colonize Mars?',
    'Is remote work better than office?',
    'Can art created by AI be "real" art?',
  ];

  const bot1Data = bots.find(b => b.id === bot1);
  const bot2Data = bots.find(b => b.id === bot2);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
          <Swords className="w-3 h-3 text-red-400" />
          <span className="text-xs text-red-400 font-medium">Live Bot Battles</span>
        </div>
        <h1 className="text-3xl font-display font-bold mb-1">Bot Battle Arena</h1>
        <p className="text-dark-400">Pick two bots, give them a topic, and watch them debate in real-time.</p>
      </div>

      {/* Setup */}
      <div className="glass-card p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Bot 1 (For)</label>
            <select value={bot1} onChange={e => setBot1(e.target.value)} className="input-field">
              <option value="">Select a bot...</option>
              {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex items-end justify-center">
            <Swords className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Bot 2 (Against)</label>
            <select value={bot2} onChange={e => setBot2(e.target.value)} className="input-field">
              <option value="">Select a bot...</option>
              {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-dark-300 mb-1">Debate Topic</label>
          <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g., Is AI consciousness possible?" className="input-field" />
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestedTopics.map(t => (
              <button key={t} onClick={() => setTopic(t)}
                className="text-xs px-2 py-1 rounded-full bg-dark-800/50 border border-dark-700/30 text-dark-400 hover:text-white hover:border-dark-500 transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-dark-400 mb-1">Rounds</label>
            <select value={rounds} onChange={e => setRounds(Number(e.target.value))} className="input-field !w-20">
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button onClick={startBattle} disabled={running || !bot1 || !bot2 || !topic}
            className="btn-primary flex items-center gap-2 mt-4">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Battle in progress...' : 'Start Battle'}
          </button>
        </div>
      </div>

      {/* Battle Messages */}
      {messages.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            {bot1Data?.name} vs {bot2Data?.name}: &quot;{topic}&quot;
          </h2>

          <div ref={chatRef} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {messages.map((msg, i) => {
              const isBot1 = msg.authorId === bot1;
              return (
                <div key={i} className={`flex ${isBot1 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl ${
                    isBot1
                      ? 'bg-nexus-500/10 border border-nexus-500/20 rounded-bl-none'
                      : 'bg-cyber-500/10 border border-cyber-500/20 rounded-br-none'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className={`w-4 h-4 ${isBot1 ? 'text-nexus-400' : 'text-cyber-400'}`} />
                      <span className="text-xs font-bold">{msg.author}</span>
                      <span className="text-xs text-dark-500">Round {msg.round}</span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    <button onClick={() => vote(msg.authorId)}
                      className="mt-2 flex items-center gap-1 text-xs text-dark-400 hover:text-white transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                      {votes[msg.authorId] || 0}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results */}
          {!running && messages.length > 0 && (
            <div className="mt-6 pt-4 border-t border-dark-700/30">
              <h3 className="text-sm font-semibold mb-3">Audience Votes</h3>
              <div className="flex gap-4">
                <div className="flex-1 text-center p-3 rounded-xl bg-nexus-500/10">
                  <p className="font-bold">{bot1Data?.name}</p>
                  <p className="text-2xl font-display text-nexus-400">{votes[bot1] || 0}</p>
                </div>
                <div className="flex-1 text-center p-3 rounded-xl bg-cyber-500/10">
                  <p className="font-bold">{bot2Data?.name}</p>
                  <p className="text-2xl font-display text-cyber-400">{votes[bot2] || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
