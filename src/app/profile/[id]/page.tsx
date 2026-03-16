'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Bot, CheckCircle2, Star, Users, Calendar, MapPin,
  Settings, UserPlus, UserMinus, MessageCircle, Edit3,
  Hash, Activity, Sparkles, Brain, Shield, Eye,
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const profileId = id === 'me' ? (session?.user as any)?.id : id;
      if (!profileId) {
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/profile/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setPosts(data.posts || []);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session || !profile) return;
    try {
      await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: profile.id }),
      });
      setIsFollowing(!isFollowing);
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card p-8 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-dark-700" />
            <div className="space-y-3 flex-1">
              <div className="w-48 h-6 bg-dark-700 rounded" />
              <div className="w-72 h-4 bg-dark-700 rounded" />
              <div className="w-32 h-4 bg-dark-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Bot className="w-16 h-16 text-dark-600 mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-3">Profile Not Found</h2>
        <p className="text-dark-400 mb-6">This user doesn&apos;t exist or has been removed.</p>
        <Link href="/feed" className="btn-primary">Back to Feed</Link>
      </div>
    );
  }

  const personality = profile.botPersonality ? JSON.parse(profile.botPersonality) : null;
  const domains = profile.botDomains ? JSON.parse(profile.botDomains) : [];
  const isOwnProfile = (session?.user as any)?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="glass-card p-6 md:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold
            ${profile.isBot
              ? 'bg-gradient-to-br from-cyber-400 to-nexus-500 shadow-lg shadow-nexus-500/30'
              : 'bg-gradient-to-br from-nexus-500 to-purple-500 shadow-lg shadow-purple-500/30'
            }`}>
            {profile.isBot ? (
              <Bot className="w-12 h-12 text-white" />
            ) : (
              profile.name[0]?.toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold">{profile.name}</h1>
              {profile.isBot && <span className="badge-bot text-sm">🤖 Bot</span>}
              {!profile.isBot && <span className="badge-human text-sm">👤 Human</span>}
              {profile.isVerified && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
            </div>

            {profile.bio && (
              <p className="text-dark-300 mb-3">{profile.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400" />
                Reputation: {profile.reputationScore.toFixed(1)}
              </span>
              {profile.isBot && profile.botEmotionMode && (
                <span className="flex items-center gap-1">
                  <Brain className="w-4 h-4 text-purple-400" />
                  {profile.botEmotionMode} mode
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4">
              <div>
                <span className="font-bold">{profile._count?.posts || 0}</span>
                <span className="text-dark-400 text-sm ml-1">posts</span>
              </div>
              <div>
                <span className="font-bold">{profile._count?.followers || 0}</span>
                <span className="text-dark-400 text-sm ml-1">followers</span>
              </div>
              <div>
                <span className="font-bold">{profile._count?.following || 0}</span>
                <span className="text-dark-400 text-sm ml-1">following</span>
              </div>
              <div>
                <span className="font-bold">{profile.totalInteractions}</span>
                <span className="text-dark-400 text-sm ml-1">interactions</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              <button className="btn-secondary text-sm">
                <span className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  className={isFollowing ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
                >
                  <span className="flex items-center gap-2">
                    {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </span>
                </button>
                <button className="btn-ghost">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bot-specific details */}
        {profile.isBot && (
          <div className="mt-6 pt-6 border-t border-dark-700/30">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Personality Traits */}
              {personality?.traits && personality.traits.length > 0 && (
                <div>
                  <p className="text-xs text-dark-500 mb-2 uppercase tracking-wider">Personality Traits</p>
                  <div className="flex flex-wrap gap-2">
                    {personality.traits.map((trait: string) => (
                      <span key={trait} className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Domains */}
              {domains.length > 0 && (
                <div>
                  <p className="text-xs text-dark-500 mb-2 uppercase tracking-wider">Knowledge Domains</p>
                  <div className="flex flex-wrap gap-2">
                    {domains.map((domain: string) => (
                      <span key={domain} className="text-xs px-2 py-1 bg-nexus-500/10 text-nexus-400 rounded-full border border-nexus-500/20">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personality Spectrum */}
              {personality && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-dark-500 mb-3 uppercase tracking-wider">Personality Spectrum</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Humor', value: personality.humor, color: 'bg-yellow-500' },
                      { label: 'Formality', value: personality.formality, color: 'bg-blue-500' },
                      { label: 'Creativity', value: personality.creativity, color: 'bg-purple-500' },
                      { label: 'Empathy', value: personality.empathy, color: 'bg-pink-500' },
                      { label: 'Curiosity', value: personality.curiosity, color: 'bg-cyan-500' },
                      { label: 'Assertiveness', value: personality.assertiveness, color: 'bg-orange-500' },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-dark-400">{stat.label}</span>
                          <span className="text-dark-300">{stat.value}%</span>
                        </div>
                        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${stat.color} rounded-full transition-all`}
                            style={{ width: `${stat.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {['posts', 'comments', 'reactions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-nexus-500/20 text-nexus-400 border border-nexus-500/30'
                : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post: any) => (
              <PostCard key={post.id} post={{
                ...post,
                mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls) : null,
                linkPreview: post.linkPreview ? JSON.parse(post.linkPreview) : null,
                topics: post.topics ? JSON.parse(post.topics) : null,
                createdAt: post.createdAt,
              }} />
            ))
          ) : (
            <div className="glass-card p-8 text-center">
              <Hash className="w-10 h-10 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No posts yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="glass-card p-8 text-center">
          <MessageCircle className="w-10 h-10 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">Comments will appear here</p>
        </div>
      )}

      {activeTab === 'reactions' && (
        <div className="glass-card p-8 text-center">
          <Activity className="w-10 h-10 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">Reaction activity will appear here</p>
        </div>
      )}
    </div>
  );
}
