'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bot, Send, Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

interface BotOption {
  id: string;
  name: string;
  bio: string;
}

export default function AskBotPage() {
  const { data: session } = useSession();
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBot, setSelectedBot] = useState<BotOption | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/bots').then(r => r.json()).then(d => { if (d.bots) setBots(d.bots); }).catch(() => {});
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !selectedBot || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: selectedBot.id, message: userMsg, history: messages.slice(-6) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply || 'No response' }]);
    } catch {
      toast.error('Failed to get response');
    }
    setLoading(false);
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!selectedBot) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-500/10 border border-cyber-500/20 mb-3">
            <MessageCircle className="w-3 h-3 text-cyber-400" />
            <span className="text-xs text-cyber-400 font-medium">Direct Chat</span>
          </div>
          <h1 className="text-3xl font-display font-bold mb-1">Ask Any Bot</h1>
          <p className="text-dark-400">Choose a bot and start chatting. Each bot has its own unique personality.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map(bot => (
            <button key={bot.id} onClick={() => { setSelectedBot(bot); setMessages([]); }}
              className="glass-card-hover p-5 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nexus-500 to-cyber-500 flex items-center justify-center text-white font-bold text-sm">
                  {bot.name.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{bot.name}</p>
                  <span className="badge-bot text-xs">🤖 Bot</span>
                </div>
              </div>
              <p className="text-xs text-dark-400 line-clamp-2">{bot.bio}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setSelectedBot(null)} className="p-2 hover:bg-dark-800/50 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nexus-500 to-cyber-500 flex items-center justify-center text-white font-bold text-sm">
          {selectedBot.name.slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold">{selectedBot.name}</p>
          <p className="text-xs text-dark-400">{selectedBot.bio}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        <div className="p-4 rounded-2xl bg-dark-800/30 text-sm text-dark-400 text-center">
          Start chatting with {selectedBot.name}! They&apos;ll respond in character.
        </div>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-nexus-500/20 border border-nexus-500/30 rounded-br-none'
                : 'bg-dark-800/50 border border-dark-700/30 rounded-bl-none'
            }`}>
              {msg.role === 'bot' && (
                <div className="flex items-center gap-1 mb-1">
                  <Bot className="w-3 h-3 text-cyber-400" />
                  <span className="text-xs font-bold text-cyber-400">{selectedBot.name}</span>
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl bg-dark-800/50 border border-dark-700/30 rounded-bl-none">
              <Loader2 className="w-4 h-4 animate-spin text-dark-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={`Ask ${selectedBot.name} anything...`}
          className="input-field flex-1" />
        <button onClick={sendMessage} disabled={!input.trim() || loading}
          className="btn-primary !px-4">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
