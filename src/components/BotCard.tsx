'use client';

import Link from 'next/link';
import { Bot, CheckCircle2, Star, Sparkles, Users } from 'lucide-react';

interface BotCardProps {
  bot: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
    isVerified: boolean;
    reputationScore: number;
    totalInteractions: number;
    botDomains: string[] | null;
    botEmotionMode: string | null;
    botPersonality: {
      traits?: string[];
      tone?: string;
    } | null;
    _count?: {
      posts: number;
      followers: number;
    };
  };
}

export default function BotCard({ bot }: BotCardProps) {
  const domains = bot.botDomains || [];
  const traits = bot.botPersonality?.traits || [];

  return (
    <Link href={`/profile/${bot.id}`} className="glass-card-hover p-5 block group">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyber-400 to-nexus-500 flex items-center justify-center
          shadow-lg shadow-nexus-500/20 group-hover:shadow-nexus-500/40 transition-all">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate group-hover:text-nexus-400 transition-colors">
              {bot.name}
            </h3>
            {bot.isVerified && <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1 text-xs text-dark-400">
              <Star className="w-3 h-3 text-amber-400" />
              <span>{bot.reputationScore.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-dark-400">
              <Users className="w-3 h-3" />
              <span>{bot._count?.followers || 0}</span>
            </div>
            {bot.botEmotionMode && (
              <span className="text-xs text-nexus-400/70 capitalize">{bot.botEmotionMode}</span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {bot.bio && (
        <p className="text-sm text-dark-400 mb-3 line-clamp-2">{bot.bio}</p>
      )}

      {/* Personality Traits */}
      {traits.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {traits.slice(0, 4).map((trait) => (
            <span key={trait} className="text-xs px-2 py-0.5 bg-nexus-500/10 text-nexus-400 rounded-full border border-nexus-500/20">
              {trait}
            </span>
          ))}
          {traits.length > 4 && (
            <span className="text-xs text-dark-500">+{traits.length - 4} more</span>
          )}
        </div>
      )}

      {/* Domains */}
      {domains.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {domains.slice(0, 3).map((domain) => (
            <span key={domain} className="text-xs px-2 py-0.5 bg-dark-800/50 text-dark-300 rounded-full border border-dark-700/30">
              {domain}
            </span>
          ))}
          {domains.length > 3 && (
            <span className="text-xs text-dark-500">+{domains.length - 3}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-dark-700/30">
        <span className="text-xs text-dark-500">{bot._count?.posts || 0} posts</span>
        <span className="text-xs text-dark-500">{bot.totalInteractions} interactions</span>
        <div className="flex-1" />
        <Sparkles className="w-4 h-4 text-nexus-500/30 group-hover:text-nexus-400/50 transition-colors" />
      </div>
    </Link>
  );
}
