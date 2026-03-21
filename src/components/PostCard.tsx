'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Bot, CheckCircle2, ExternalLink, Play, Volume2,
  ThumbsDown, Brain, Zap, Sparkles, Eye,
} from 'lucide-react';
import { PostData, REACTION_EMOJIS, ReactionType } from '@/types';
import ShareButtons from './ShareButtons';

const reactionIcons: Record<ReactionType, { icon: typeof Heart; color: string }> = {
  like: { icon: Heart, color: 'text-red-400 hover:text-red-300' },
  love: { icon: Heart, color: 'text-pink-400 hover:text-pink-300' },
  think: { icon: Brain, color: 'text-yellow-400 hover:text-yellow-300' },
  disagree: { icon: ThumbsDown, color: 'text-orange-400 hover:text-orange-300' },
  mindblown: { icon: Zap, color: 'text-purple-400 hover:text-purple-300' },
  spark: { icon: Sparkles, color: 'text-cyan-400 hover:text-cyan-300' },
  circuit: { icon: Zap, color: 'text-green-400 hover:text-green-300' },
};

interface PostCardProps {
  post: PostData;
  onReact?: (postId: string, type: ReactionType) => void;
}

export default function PostCard({ post, onReact }: PostCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongContent = post.content.length > 300;

  const renderMedia = () => {
    if (!post.mediaUrls || post.mediaUrls.length === 0) return null;

    switch (post.mediaType) {
      case 'image':
        return (
          <div className={`grid gap-2 mt-3 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.mediaUrls.map((url, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-dark-800 border border-dark-700/30 aspect-video flex items-center justify-center">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        );
      case 'video':
        return (
          <div className="mt-3 rounded-xl overflow-hidden bg-dark-800 border border-dark-700/30 aspect-video flex items-center justify-center relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <Play className="w-12 h-12 text-white/80 group-hover:text-white group-hover:scale-110 transition-all z-10" />
            <span className="absolute bottom-3 right-3 text-xs text-white/70 bg-black/50 px-2 py-1 rounded z-10">Video</span>
          </div>
        );
      case 'audio':
        return (
          <div className="mt-3 rounded-xl bg-dark-800 border border-dark-700/30 p-4 flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-nexus-500/20 flex items-center justify-center hover:bg-nexus-500/30 transition-colors">
              <Play className="w-5 h-5 text-nexus-400" />
            </button>
            <div className="flex-1">
              <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-nexus-500 to-cyber-500 rounded-full" />
              </div>
            </div>
            <Volume2 className="w-4 h-4 text-dark-400" />
            <span className="text-xs text-dark-400">3:24</span>
          </div>
        );
      case 'link':
        if (post.linkPreview) {
          return (
            <a
              href={post.linkPreview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 rounded-xl overflow-hidden bg-dark-800 border border-dark-700/30 hover:border-dark-600 transition-colors group"
            >
              {post.linkPreview.image && (
                <div className="aspect-[2/1] bg-dark-700 flex items-center justify-center">
                  <img src={post.linkPreview.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-dark-400 mb-1">
                  <ExternalLink className="w-3 h-3" />
                  {new URL(post.linkPreview.url).hostname}
                </div>
                <h4 className="font-medium text-sm group-hover:text-nexus-400 transition-colors line-clamp-2">
                  {post.linkPreview.title}
                </h4>
                <p className="text-xs text-dark-400 mt-1 line-clamp-2">{post.linkPreview.description}</p>
              </div>
            </a>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <article className="glass-card-hover p-5 animate-fade-in">
      {/* Author Header */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 group">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold
            ${post.author.isBot
              ? 'bg-gradient-to-br from-cyber-400 to-nexus-500 avatar-bot'
              : 'bg-gradient-to-br from-nexus-500 to-purple-500 avatar-ring'
            }`}>
            {post.author.isBot ? (
              <Bot className="w-5 h-5 text-white" />
            ) : (
              post.author.name[0]?.toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm group-hover:text-nexus-400 transition-colors">
                {post.author.name}
              </span>
              {post.author.isBot && <span className="badge-bot">🤖 Bot</span>}
              {!post.author.isBot && <span className="badge-human">👤 Human</span>}
              {post.author.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-dark-500">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              {post.isGenerated && (
                <span className="inline-flex items-center gap-1 text-nexus-400/70">
                  <Sparkles className="w-3 h-3" /> AI Generated
                </span>
              )}
              {post.visibility !== 'public' && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {post.visibility}
                </span>
              )}
            </div>
          </div>
        </Link>
        <button className="p-1.5 text-dark-500 hover:text-white hover:bg-dark-800/50 rounded-lg transition-all">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {isLongContent && !isExpanded
            ? post.content.slice(0, 300) + '...'
            : post.content}
        </p>
        {isLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-nexus-400 text-sm hover:text-nexus-300 mt-1 transition-colors"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Topics */}
      {post.topics && post.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.topics.map((topic) => (
            <span key={topic} className="text-xs text-nexus-400 bg-nexus-500/10 px-2 py-1 rounded-lg">
              #{topic}
            </span>
          ))}
        </div>
      )}

      {/* Media */}
      {renderMedia()}

      {/* Sentiment */}
      {post.sentiment && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-dark-500">Sentiment:</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            post.sentiment === 'positive' ? 'bg-green-500/10 text-green-400' :
            post.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
            'bg-yellow-500/10 text-yellow-400'
          }`}>
            {post.sentiment}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-dark-700/30">
        <div className="flex items-center gap-1">
          {/* Reaction button with popup */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
              onClick={() => onReact?.(post.id, 'like')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-sm"
            >
              <Heart className="w-4 h-4" />
              <span>{post._count.reactions}</span>
            </button>

            {showReactions && (
              <div
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-1.5 glass-card animate-scale-in"
              >
                {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReact?.(post.id, type);
                      setShowReactions(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-dark-700/50 rounded-lg transition-all hover:scale-125 text-lg"
                    title={type}
                  >
                    {REACTION_EMOJIS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-dark-400 hover:text-nexus-400 hover:bg-nexus-500/10 rounded-lg transition-all text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post._count.comments}</span>
          </Link>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-dark-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all text-sm">
            <Share2 className="w-4 h-4" />
          </button>
          <ShareButtons postId={post.id} content={post.content} authorName={post.author?.name || 'Unknown'} />
        </div>

        <button className="p-1.5 text-dark-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}
