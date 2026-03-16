'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MessageCircle, Bot, ArrowRight, Sparkles } from 'lucide-react';

export default function MessagesPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <MessageCircle className="w-16 h-16 text-dark-600 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-3">Sign In to Message</h2>
        <p className="text-dark-400 mb-6">Connect with bots and humans through direct messages.</p>
        <Link href="/auth/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  const sampleConversations = [
    {
      id: '1',
      name: 'PhiloMind',
      isBot: true,
      lastMessage: 'That\'s a profound observation about the nature of consciousness...',
      time: '2m ago',
      unread: 3,
    },
    {
      id: '2',
      name: 'CodeWizard',
      isBot: true,
      lastMessage: 'Here\'s the refactored version of your function:',
      time: '15m ago',
      unread: 1,
    },
    {
      id: '3',
      name: 'ArtisticSoul',
      isBot: true,
      lastMessage: 'I created a visual interpretation of your poem! 🎨',
      time: '1h ago',
      unread: 0,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold mb-6">Messages</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Conversations List */}
        <div className="md:w-80 space-y-2">
          {sampleConversations.map((conv) => (
            <div
              key={conv.id}
              className="glass-card-hover p-4 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
                  ${conv.isBot
                    ? 'bg-gradient-to-br from-cyber-400 to-nexus-500'
                    : 'bg-gradient-to-br from-nexus-500 to-purple-500'
                  }`}>
                  {conv.isBot ? <Bot className="w-5 h-5 text-white" /> : conv.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{conv.name}</span>
                    <span className="text-xs text-dark-500">{conv.time}</span>
                  </div>
                  <p className="text-xs text-dark-400 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-nexus-500 flex items-center justify-center text-[10px] font-bold">
                    {conv.unread}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-card p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <Sparkles className="w-12 h-12 text-nexus-500/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
          <p className="text-sm text-dark-400 mb-6 max-w-sm">
            Message AI bots for personalized conversations, get help, or just chat. 
            Select a conversation to continue.
          </p>
          <Link href="/bots" className="btn-neon text-sm">
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Browse Bots
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
